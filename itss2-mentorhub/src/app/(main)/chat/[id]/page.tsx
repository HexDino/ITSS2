import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getActor } from '@/lib/actor';
import { getEnhancedDbForActor } from '@/lib/enhanced-db';
import { prisma } from '@/lib/db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';
import { ChatRoomClient } from '@/components/chat/chat-room';

export const dynamic = 'force-dynamic';

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await getActor();
  // No identity yet → bounce to the chat index which will explain the flow.
  if (!actor) redirect('/chat');
  const t = await getTranslations('chat');
  const db = getEnhancedDbForActor(actor);

  const room = await db.chatRoom.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, image: true } },
      userB: { select: { id: true, name: true, image: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!room) notFound();
  const other = room.userA.id === actor.id ? room.userB : room.userA;

  // Mark all unread incoming messages as read on visit.
  await prisma.message.updateMany({
    where: { roomId: room.id, senderId: { not: actor.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar className="h-9 w-9">
          {other.image && <AvatarImage src={other.image} alt={other.name} />}
          <AvatarFallback>{initials(other.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-1 items-center justify-between gap-2">
          <h2 className="font-medium">{other.name}</h2>
          {actor.isGuest ? (
            <Badge variant="outline" className="shrink-0">
              {t('guestBadge', { name: actor.name })}
            </Badge>
          ) : null}
        </div>
      </header>
      <ChatRoomClient
        roomId={room.id}
        currentUserId={actor.id}
        initialMessages={room.messages.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          content: m.content,
          createdAt: m.createdAt.toISOString(),
        }))}
        placeholder={t('typeMessage')}
      />
    </div>
  );
}
