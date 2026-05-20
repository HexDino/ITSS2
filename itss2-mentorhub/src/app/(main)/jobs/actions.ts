'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { prisma } from '@/lib/db';

const applySchema = z.object({
  jobId: z.string().cuid(),
  coverLetter: z.string().max(5000).optional(),
});

export async function applyToJobAction(input: unknown) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'STUDENT') {
    return { ok: false as const, error: 'ONLY_STUDENT' };
  }
  const parsed = applySchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'INVALID' };

  const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });

  const db = await getEnhancedDb();
  try {
    await db.application.create({
      data: {
        jobId: parsed.data.jobId,
        studentId: session.user.id,
        studentProfileId: profile?.id,
        cvSnapshotUrl: profile?.cvUrl ?? undefined,
        coverLetter: parsed.data.coverLetter,
      },
    });
  } catch (err) {
    // Unique (jobId, studentId) violation => already applied
    return { ok: false as const, error: 'ALREADY_APPLIED' };
  }
  revalidatePath(`/jobs/${parsed.data.jobId}`);
  revalidatePath('/applications');
  return { ok: true as const };
}
