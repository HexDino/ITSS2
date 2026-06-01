'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getEnhancedDbForActor } from '@/lib/enhanced-db';
import { getActor, getOrCreateActor } from '@/lib/actor';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

export async function startChatAction(targetUserId: string) {
  // Auto-create a guest user on first call so anonymous visitors can DM mentors.
  const actor = await getOrCreateActor();
  if (targetUserId === actor.id) return { ok: false as const, error: 'SELF' };

  // Throttle room creation so a single visitor can't enumerate every mentor.
  const rl = rateLimit(`chat-start:${actor.id}`, { capacity: 10, refillPerSec: 0.05 });
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  // ChatRoom unique on (userAId, userBId) — sort the pair so a single room is reused.
  const [a, b] = [actor.id, targetUserId].sort();
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
  // Sending a message should also auto-create a guest if needed (e.g. the
  // visitor opened the chat tab directly without going through the mentor page).
  const actor = await getOrCreateActor();

  // Spam guard: ~30 messages/minute for logged-in users; tighter for guests.
  const limit = actor.isGuest
    ? { capacity: 10, refillPerSec: 0.17 } // ~10/min
    : { capacity: 30, refillPerSec: 0.5 }; // ~30/min
  const rl = rateLimit(`msg:${actor.id}`, limit);
  if (!rl.allowed) return { ok: false as const, error: 'RATE_LIMIT' };

  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: 'INVALID' };

  const db = getEnhancedDbForActor(actor);
  await db.message.create({
    data: {
      roomId: parsed.data.roomId,
      content: parsed.data.content,
      senderId: actor.id,
    },
  });
  // Bump room timestamp so chat list ordering reflects the latest activity.
  await db.chatRoom.update({
    where: { id: parsed.data.roomId },
    data: { updatedAt: new Date() },
  });
  revalidatePath(`/chat/${parsed.data.roomId}`);
  revalidatePath('/chat');
  return { ok: true as const };
}

export async function markRoomReadAction(roomId: string) {
  const actor = await getActor();
  if (!actor) return { ok: false as const, error: 'UNAUTHORIZED' };
  // Mark every unread message in the room (not sent by me) as read.
  await prisma.message.updateMany({
    where: {
      roomId,
      senderId: { not: actor.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  });
  revalidatePath('/chat');
  return { ok: true as const };
}
