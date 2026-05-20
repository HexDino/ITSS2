'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function startChatAction(targetUserId: string) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };
  if (targetUserId === session.user.id) return { ok: false as const, error: 'SELF' };

  // ChatRoom unique on (userAId, userBId) — sort the pair so a single room is reused.
  const [a, b] = [session.user.id, targetUserId].sort();
  const existing = await prisma.chatRoom.findUnique({
    where: { userAId_userBId: { userAId: a, userBId: b } },
  });
  if (existing) redirect(`/chat/${existing.id}`);

  const room = await prisma.chatRoom.create({ data: { userAId: a, userBId: b } });
  redirect(`/chat/${room.id}`);
}

const messageSchema = z.object({
  roomId: z.string().cuid(),
  content: z.string().min(1).max(5000),
});

export async function sendMessageAction(input: unknown) {
  const session = await auth();
  if (!session?.user) return { ok: false as const, error: 'UNAUTHORIZED' };
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'INVALID' };

  const db = await getEnhancedDb();
  await db.message.create({
    data: {
      roomId: parsed.data.roomId,
      content: parsed.data.content,
      senderId: session.user.id,
    },
  });
  revalidatePath(`/chat/${parsed.data.roomId}`);
  return { ok: true as const };
}
