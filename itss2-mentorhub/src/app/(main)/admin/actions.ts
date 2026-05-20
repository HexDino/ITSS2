'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') throw new Error('FORBIDDEN');
  return session;
}

export async function verifyMentorAction(mentorProfileId: string, verified: boolean) {
  await requireAdmin();
  await prisma.mentorProfile.update({ where: { id: mentorProfileId }, data: { verified } });
  revalidatePath('/admin');
}

export async function approveChannelAction(channelId: string, approved: boolean) {
  await requireAdmin();
  await prisma.channel.update({ where: { id: channelId }, data: { approved } });
  revalidatePath('/admin');
  revalidatePath('/channels');
}

export async function resolveReportAction(reportId: string, status: 'RESOLVED' | 'DISMISSED') {
  await requireAdmin();
  await prisma.report.update({ where: { id: reportId }, data: { status } });
  revalidatePath('/admin');
}
