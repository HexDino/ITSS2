'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { sanitizeHtml } from '@/lib/sanitize';
import { createNotification } from '@/lib/notify';

async function requireEmployerOrAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error('UNAUTHORIZED');
  if (session.user.role !== 'EMPLOYER' && session.user.role !== 'ADMIN') {
    throw new Error('FORBIDDEN');
  }
  return session;
}

async function resolveEmployerCompanyId(userId: string): Promise<string | null> {
  const ep = await prisma.employerProfile.findUnique({ where: { userId } });
  return ep?.companyId ?? null;
}

const jobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(20000),
  requirements: z.string().max(10000).optional(),
  benefits: z.string().max(5000).optional(),
  type: z.enum(['INTERNSHIP', 'JUNIOR', 'PARTTIME', 'FULLTIME']),
  status: z.enum(['OPEN', 'CLOSED', 'DRAFT']).default('OPEN'),
  location: z.string().max(200).optional(),
  salaryRange: z.string().max(200).optional(),
  tags: z.string().optional(),
  deadline: z.string().optional(),
});

export async function createJobAction(input: unknown) {
  const session = await requireEmployerOrAdmin();
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };

  const companyId = await resolveEmployerCompanyId(session.user.id);
  if (!companyId && session.user.role !== 'ADMIN') {
    return { ok: false as const, error: 'NO_COMPANY' };
  }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 12)
    : [];

  const db = await getEnhancedDb();
  const job = await db.job.create({
    data: {
      title: parsed.data.title,
      description: sanitizeHtml(parsed.data.description),
      requirements: parsed.data.requirements ? sanitizeHtml(parsed.data.requirements) : undefined,
      benefits: parsed.data.benefits ? sanitizeHtml(parsed.data.benefits) : undefined,
      type: parsed.data.type,
      status: parsed.data.status,
      location: parsed.data.location,
      salaryRange: parsed.data.salaryRange,
      tags,
      deadline: parsed.data.deadline ? new Date(parsed.data.deadline) : null,
      companyId: companyId as string,
      postedById: session.user.id,
    },
  });
  revalidatePath('/employer');
  revalidatePath('/jobs');
  return { ok: true as const, jobId: job.id };
}

export async function updateJobStatusAction(jobId: string, status: 'OPEN' | 'CLOSED' | 'DRAFT') {
  await requireEmployerOrAdmin();
  const db = await getEnhancedDb();
  await db.job.update({ where: { id: jobId }, data: { status } });
  revalidatePath('/employer');
  revalidatePath(`/jobs/${jobId}`);
}

export async function deleteJobAction(jobId: string) {
  await requireEmployerOrAdmin();
  const db = await getEnhancedDb();
  await db.job.delete({ where: { id: jobId } });
  revalidatePath('/employer');
  redirect('/employer');
}

export async function updateApplicationStatusAction(
  applicationId: string,
  status: 'RECEIVED' | 'REVIEWING' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED',
  note?: string,
) {
  await requireEmployerOrAdmin();
  const db = await getEnhancedDb();
  const updated = await db.application.update({
    where: { id: applicationId },
    data: { status, ...(note ? { note } : {}) },
    select: { studentId: true, job: { select: { title: true, id: true } } },
  });
  void createNotification({
    recipientId: updated.studentId,
    type: 'APPLICATION_STATUS',
    title: `Đơn ứng tuyển: ${status}`,
    body: updated.job.title,
    link: `/jobs/${updated.job.id}`,
  });
  revalidatePath('/employer');
  revalidatePath('/applications');
}
