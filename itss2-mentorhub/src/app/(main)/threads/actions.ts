'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getEnhancedDb, getEnhancedDbForActor } from '@/lib/enhanced-db';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { getOrCreateActor } from '@/lib/actor';
import { htmlPlainLength } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limit';
import { createNotification } from '@/lib/notify';
/**
 * Server action backing POST /api/answer.
 * Validates payload (question_id, content, is_anonymous), enforces 40,000 char
 * limit on plain-text content, persists via ZenStack-enhanced Prisma (policy aware).
 */
const schema = z.object({
  questionId: z.string().min(1),
  content: z.string().min(1, 'EMPTY').max(80000), // raw HTML guard; plain text validated below
  isAnonymous: z.boolean(),
});

export async function createAnswerAction(input: unknown) {
  // Allow guests: auto-create a cookie-backed anonymous User when needed.
  const actor = await getOrCreateActor();

  // Spam guard: guests get ~5/hour, logged-in users ~10/hour.
  const rl = rateLimit(`answer:${actor.id}`, {
    capacity: actor.isGuest ? 5 : 10,
    refillPerSec: (actor.isGuest ? 5 : 10) / 3600,
  });
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };
  }

  const plainLen = htmlPlainLength(parsed.data.content);
  if (plainLen < 1) return { ok: false as const, error: 'EMPTY' };
  if (plainLen > 40000) return { ok: false as const, error: 'TOO_LONG' };

  const cleanContent = sanitizeHtml(parsed.data.content);

  const db = getEnhancedDbForActor(actor);
  // Guests are always anonymous regardless of the toggle.
  const isAnonymous = actor.isGuest ? true : parsed.data.isAnonymous;
  try {
    const answer = await db.answer.create({
      data: {
        threadId: parsed.data.questionId,
        content: cleanContent,
        isAnonymous,
        authorId: actor.id,
      },
    });
    // Notify thread author asynchronously (don't block response).
    void prisma.thread
      .findUnique({ where: { id: parsed.data.questionId }, select: { authorId: true, title: true } })
      .then((thread) => {
        if (thread && thread.authorId !== actor.id) {
          return createNotification({
            recipientId: thread.authorId,
            type: 'NEW_ANSWER',
            title: 'Có câu trả lời mới',
            body: thread.title,
            link: `/threads/${parsed.data.questionId}`,
          });
        }
      });
    revalidatePath(`/threads/${parsed.data.questionId}`);
    return { ok: true as const, message: 'OK', answerId: answer.id };
  } catch (err) {
    return { ok: false as const, error: 'SERVER_ERROR', message: (err as Error).message };
  }
}

// ---------------------------------------------------------------------------
// Accept answer — only the thread author or admin may mark accepted.
// Enforced via ZenStack policy on Answer.update plus an explicit guard here.
// ---------------------------------------------------------------------------
export async function acceptAnswerAction(answerId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };

  const db = await getEnhancedDb();
  const answer = await db.answer.findUnique({
    where: { id: answerId },
    include: { thread: { select: { id: true, authorId: true } } },
  });
  if (!answer) return { ok: false as const, error: 'NOT_FOUND' };

  if (answer.thread.authorId !== session.user.id && session.user.role !== 'ADMIN') {
    return { ok: false as const, error: 'FORBIDDEN' };
  }

  // Toggle: clear previous accepted, then set this one. Use raw prisma for batch
  // since policies already validated ownership above.
  await prisma.$transaction([
    prisma.answer.updateMany({
      where: { threadId: answer.thread.id, accepted: true },
      data: { accepted: false },
    }),
    prisma.answer.update({ where: { id: answerId }, data: { accepted: true } }),
  ]);
  if (answer.authorId !== session.user.id) {
    void createNotification({
      recipientId: answer.authorId,
      type: 'ANSWER_ACCEPTED',
      title: 'Câu trả lời của bạn được chấp nhận',
      link: `/threads/${answer.thread.id}`,
    });
  }
  revalidatePath(`/threads/${answer.thread.id}`);
  return { ok: true as const };
}

// ---------------------------------------------------------------------------
// Toggle vote (1 per user per answer). `Answer.upvotes` is a denormalized
// counter kept in sync inside the same transaction.
// ---------------------------------------------------------------------------
export async function toggleVoteAction(answerId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };

  const existing = await prisma.answerVote.findUnique({
    where: { userId_answerId: { userId: session.user.id, answerId } },
  });

  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.answerVote.delete({ where: { id: existing.id } }),
      prisma.answer.update({
        where: { id: answerId },
        data: { upvotes: { decrement: 1 } },
        select: { threadId: true, upvotes: true },
      }),
    ]);
    revalidatePath(`/threads/${updated.threadId}`);
    return { ok: true as const, voted: false, upvotes: updated.upvotes };
  }

  const [, updated] = await prisma.$transaction([
    prisma.answerVote.create({ data: { userId: session.user.id, answerId } }),
    prisma.answer.update({
      where: { id: answerId },
      data: { upvotes: { increment: 1 } },
      select: { threadId: true, upvotes: true },
    }),
  ]);
  revalidatePath(`/threads/${updated.threadId}`);
  return { ok: true as const, voted: true, upvotes: updated.upvotes };
}

// Backwards-compat alias.
export const upvoteAnswerAction = toggleVoteAction;

// ---------------------------------------------------------------------------
// Report — submit a report against a target (thread/answer/user). Status
// starts as PENDING; admins resolve via /admin.
// ---------------------------------------------------------------------------
const reportSchema = z.object({
  targetType: z.enum(['THREAD', 'ANSWER', 'USER', 'JOB', 'MESSAGE']),
  targetId: z.string().min(1),
  reason: z.string().min(5).max(1000),
});

export async function reportAction(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };

  const rl = rateLimit(`report:${session.user.id}`, { capacity: 5, refillPerSec: 5 / 3600 });
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };

  const db = await getEnhancedDb();
  await db.report.create({
    data: {
      reporterId: session.user.id,
      targetType: parsed.data.targetType,
      targetId: parsed.data.targetId,
      reason: parsed.data.reason,
    },
  });
  return { ok: true as const };
}
