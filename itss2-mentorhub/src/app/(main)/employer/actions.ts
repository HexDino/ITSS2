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

/** Normalize a yyyy-mm-dd (or ISO) string to a Date at 23:59:59 local time;
 *  reject dates that are already in the past. */
function parseDeadline(raw?: string): { ok: true; value: Date | null } | { ok: false } {
  if (!raw) return { ok: true, value: null };
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return { ok: false };
  // Treat date-only strings as end-of-day so applications stay open all day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) d.setHours(23, 59, 59, 999);
  if (d.getTime() < Date.now()) return { ok: false };
  return { ok: true, value: d };
}

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

  const deadline = parseDeadline(parsed.data.deadline);
  if (!deadline.ok) return { ok: false as const, error: 'INVALID_DEADLINE' };

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
      deadline: deadline.value,
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

// ---------------------------------------------------------------------------
// Self-service company creation for employers. Company starts unverified;
// admin verifies via /admin. Links employer profile in the same transaction.
// ---------------------------------------------------------------------------
const companySchema = z.object({
  name: z.string().min(2).max(200),
  website: z.string().url().max(500).optional().or(z.literal('')),
  industry: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
  size: z.enum(['STARTUP', 'SMALL', 'MEDIUM', 'LARGE']).default('SMALL'),
  description: z.string().max(5000).optional(),
});

const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

export async function createCompanyAction(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };
  if (session.user.role !== 'EMPLOYER' && session.user.role !== 'ADMIN') {
    return { ok: false as const, error: 'FORBIDDEN' };
  }

  const parsed = companySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };
  }

  // Ensure employer is not already linked to a company.
  const ep = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (ep?.companyId) return { ok: false as const, error: 'ALREADY_LINKED' };

  // Build unique slug.
  let slug = slugify(parsed.data.name);
  if (!slug) return { ok: false as const, error: 'INVALID_NAME' };
  const taken = await prisma.company.findUnique({ where: { slug } });
  if (taken) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  try {
    const company = await prisma.company.create({
      data: {
        name: parsed.data.name,
        slug,
        website: parsed.data.website || null,
        industry: parsed.data.industry || null,
        location: parsed.data.location || null,
        size: parsed.data.size,
        description: parsed.data.description ? sanitizeHtml(parsed.data.description) : null,
        verified: false,
      },
    });
    // Upsert employer profile linking to the new company.
    await prisma.employerProfile.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, companyId: company.id },
      update: { companyId: company.id },
    });
    revalidatePath('/employer');
    revalidatePath('/companies');
    return { ok: true as const, companyId: company.id };
  } catch (err) {
    console.error('[createCompanyAction] failed', err);
    return { ok: false as const, error: 'CREATE_FAILED' };
  }
}
