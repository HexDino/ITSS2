'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function listNotificationsAction(limit = 10) {
  const session = await auth();
  if (!session?.user) return { items: [], unread: 0 };
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),
    prisma.notification.count({ where: { recipientId: session.user.id, read: false } }),
  ]);
  return { items, unread };
}

export async function markAllReadAction() {
  const session = await auth();
  if (!session?.user) return { ok: false as const };
  await prisma.notification.updateMany({
    where: { recipientId: session.user.id, read: false },
    data: { read: true },
  });
  revalidatePath('/');
  return { ok: true as const };
}
