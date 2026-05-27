'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import type { Role } from '@prisma/client';

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(200),
  password: z
    .string()
    .min(8, 'WEAK_PASSWORD')
    .max(100)
    .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), 'WEAK_PASSWORD'),
  role: z.enum(['STUDENT', 'MENTOR', 'EMPLOYER']),
});

export async function registerAction(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.issues[0]?.message ?? 'invalid' };

  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown';
  const rl = rateLimit(`register:${ip}`, { capacity: 5, refillPerSec: 5 / 3600 });
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { ok: false as const, error: 'EMAIL_EXISTS' };

  const password = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password,
      role: parsed.data.role as Role,
    },
  });

  // Auto-create empty profile shells based on role
  if (user.role === 'STUDENT') {
    await prisma.studentProfile.create({ data: { userId: user.id, skills: [] } });
  } else if (user.role === 'MENTOR') {
    await prisma.mentorProfile.create({
      data: { userId: user.id, company: '', position: '', yearsOfExperience: 0, expertise: [] },
    });
  } else if (user.role === 'EMPLOYER') {
    await prisma.employerProfile.create({ data: { userId: user.id } });
  }

  return { ok: true as const };
}
