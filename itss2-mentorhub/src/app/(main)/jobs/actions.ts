'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

const applySchema = z.object({
  jobId: z.string().cuid(),
  coverLetter: z.string().max(5000).optional(),
});

export async function applyToJobAction(input: unknown) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'STUDENT') {
    return { ok: false as const, error: 'ONLY_STUDENT' };
  }

  // Spam guard: ~5 applications/hour per user.
  const rl = rateLimit(`apply:${session.user.id}`, { capacity: 5, refillPerSec: 5 / 3600 });
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'INVALID' };

  // Make sure the job exists and is open before going through ZenStack create policy.
  const job = await prisma.job.findUnique({
    where: { id: parsed.data.jobId },
    select: { id: true, status: true },
  });
  if (!job) return { ok: false as const, error: 'JOB_NOT_FOUND' };
  if (job.status !== 'OPEN') return { ok: false as const, error: 'JOB_CLOSED' };

  // Reject duplicate before attempting create so the error is unambiguous.
  const existing = await prisma.application.findUnique({
    where: { jobId_studentId: { jobId: job.id, studentId: session.user.id } },
    select: { id: true },
  });
  if (existing) return { ok: false as const, error: 'ALREADY_APPLIED' };

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, cvUrl: true },
  });

  const coverLetter = parsed.data.coverLetter?.trim();
  const cvSnapshotUrl = profile?.cvUrl?.trim();

  const db = await getEnhancedDb();
  try {
    await db.application.create({
      data: {
        jobId: job.id,
        studentId: session.user.id,
        ...(profile?.id ? { studentProfileId: profile.id } : {}),
        ...(cvSnapshotUrl ? { cvSnapshotUrl } : {}),
        ...(coverLetter ? { coverLetter } : {}),
      },
    });
  } catch (err) {
    console.error('[applyToJobAction] failed', err);
    return { ok: false as const, error: 'APPLY_FAILED' };
  }
  revalidatePath(`/jobs/${job.id}`);
  revalidatePath('/applications');
  return { ok: true as const };
}
