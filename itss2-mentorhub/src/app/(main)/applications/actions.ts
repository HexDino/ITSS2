'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';

const withdrawSchema = z.object({ applicationId: z.string().cuid() });

export async function withdrawApplicationAction(input: unknown) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'STUDENT') {
    return { ok: false as const, error: 'ONLY_STUDENT' };
  }
  const parsed = withdrawSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'INVALID' };

  const db = await getEnhancedDb();
  const app = await db.application.findUnique({
    where: { id: parsed.data.applicationId },
    select: { id: true, studentId: true, status: true, jobId: true },
  });
  if (!app || app.studentId !== session.user.id) {
    return { ok: false as const, error: 'NOT_FOUND' };
  }
  // Only allow withdrawing while the application has not progressed beyond review.
  if (app.status !== 'RECEIVED' && app.status !== 'REVIEWING') {
    return { ok: false as const, error: 'CANNOT_WITHDRAW' };
  }
  await db.application.delete({ where: { id: app.id } });
  revalidatePath('/applications');
  revalidatePath(`/jobs/${app.jobId}`);
  return { ok: true as const };
}
