'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { auth } from '@/lib/auth';
import { htmlPlainLength } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { rateLimit } from '@/lib/rate-limit';

const threadSchema = z.object({
  channelId: z.string().cuid(),
  channelSlug: z.string().min(1),
  title: z.string().min(5).max(300),
  content: z.string().min(1).max(80000),
  tags: z.string().optional(),
  isAnonymous: z.boolean().optional().default(false),
});

export async function createThreadAction(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };

  // Spam guard: ~5 threads/hour per user.
  const rl = rateLimit(`thread:${session.user.id}`, { capacity: 5, refillPerSec: 5 / 3600 });
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  const parsed = threadSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };

  const cleanContent = sanitizeHtml(parsed.data.content);
  const plainLen = htmlPlainLength(cleanContent);
  if (plainLen < 1 || plainLen > 40000) return { ok: false as const, error: 'INVALID_LENGTH' };

  const tags = parsed.data.tags
    ? parsed.data.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const db = await getEnhancedDb();
  const thread = await db.thread.create({
    data: {
      title: parsed.data.title,
      content: cleanContent,
      channelId: parsed.data.channelId,
      authorId: session.user.id,
      isAnonymous: parsed.data.isAnonymous ?? false,
      tags,
    },
  });

  revalidatePath(`/channels/${parsed.data.channelSlug}`);
  redirect(`/threads/${thread.id}`);
}

// ---------------------------------------------------------------------------
// Channel proposal — any user can submit; admin must approve before public.
// ---------------------------------------------------------------------------
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const CHANNEL_CATEGORIES = [
  'FRONTEND',
  'BACKEND',
  'DEVOPS',
  'MOBILE',
  'DATA_AI',
  'PROCESS_GIT',
  'PROCESS_SCRUM',
  'CAREER',
  'OTHER',
] as const;

const channelSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(1000).optional(),
  category: z.enum(CHANNEL_CATEGORIES).default('OTHER'),
  tags: z.string().optional(),
});

export async function createChannelAction(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };

  const parsed = channelSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };

  const slug = slugify(parsed.data.name);
  if (!slug) return { ok: false as const, error: 'INVALID_NAME' };

  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 8)
    : [];

  const db = await getEnhancedDb();
  try {
    // Admin can create approved channels directly; users submit for review.
    const approved = session.user.role === 'ADMIN';
    await db.channel.create({
      data: {
        name: parsed.data.name,
        slug,
        description: parsed.data.description,
        category: parsed.data.category,
        tags,
        approved,
        createdById: session.user.id,
      },
    });
    revalidatePath('/channels');
    revalidatePath('/admin');
    return { ok: true as const, approved };
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('Unique')) return { ok: false as const, error: 'DUPLICATE' };
    return { ok: false as const, error: 'SERVER_ERROR', message: msg };
  }
}
