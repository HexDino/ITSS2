'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const studentSchema = z.object({
  bio: z.string().max(2000).optional().nullable(),
  university: z.string().max(200).optional().nullable(),
  major: z.string().max(200).optional().nullable(),
  yearOfStudy: z.coerce.number().int().gte(1).lte(8).optional().nullable(),
  skills: z.string().optional(),
  github: z.string().max(200).optional().nullable(),
  linkedin: z.string().max(200).optional().nullable(),
  portfolio: z.string().url().max(500).optional().nullable().or(z.literal('')),
});

const mentorSchema = z.object({
  company: z.string().min(1).max(200),
  position: z.string().min(1).max(200),
  yearsOfExperience: z.coerce.number().int().gte(0).lte(60),
  expertise: z.string().optional(),
  bio: z.string().max(4000).optional().nullable(),
  openToChat: z.coerce.boolean().optional(),
});

export async function updateStudentProfileAction(input: unknown) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'STUDENT') return { ok: false as const, error: 'FORBIDDEN' };
  const parsed = studentSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };

  const skills = parsed.data.skills
    ? parsed.data.skills.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)
    : undefined;

  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: {
      bio: parsed.data.bio ?? undefined,
      university: parsed.data.university ?? undefined,
      major: parsed.data.major ?? undefined,
      yearOfStudy: parsed.data.yearOfStudy ?? undefined,
      github: parsed.data.github ?? undefined,
      linkedin: parsed.data.linkedin ?? undefined,
      portfolio: parsed.data.portfolio || undefined,
      ...(skills ? { skills } : {}),
    },
  });
  revalidatePath('/profile');
  return { ok: true as const };
}

export async function updateMentorProfileAction(input: unknown) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'MENTOR') return { ok: false as const, error: 'FORBIDDEN' };
  const parsed = mentorSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'INVALID' };

  const expertise = parsed.data.expertise
    ? parsed.data.expertise.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 30)
    : undefined;

  await prisma.mentorProfile.update({
    where: { userId: session.user.id },
    data: {
      company: parsed.data.company,
      position: parsed.data.position,
      yearsOfExperience: parsed.data.yearsOfExperience,
      bio: parsed.data.bio ?? undefined,
      openToChat: parsed.data.openToChat ?? undefined,
      ...(expertise ? { expertise } : {}),
    },
  });
  revalidatePath('/profile');
  return { ok: true as const };
}
