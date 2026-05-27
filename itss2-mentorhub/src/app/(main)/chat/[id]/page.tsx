import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { prisma } from '@/lib/db';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';
import { ChatRoomClient } from '@/components/chat/chat-room';

export const dynamic = 'force-dynamic';

export default async function ChatRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return null;
  const t = await getTranslations('chat');
  const db = await getEnhancedDb();

  const room = await db.chatRoom.findUnique({
    where: { id },
    include: {
      userA: { select: { id: true, name: true, image: true } },
      userB: { select: { id: true, name: true, image: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!room) notFound();
  const other = room.userA.id === session.user.id ? room.userB : room.userA;

  // Mark all unread incoming messages as read on visit.
  await prisma.message.updateMany({
    where: { roomId: room.id, senderId: { not: session.user.id }, readAt: null },
    data: { readAt: new Date() },
  });

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col rounded-lg border border-border bg-card">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Avatar className="h-9 w-9">
          {other.image && <AvatarImage src={other.image} alt={other.name} />}
          <AvatarFallback>{initials(other.name)}</AvatarFallback>
        </Avatar>
        <h2 className="font-medium">{other.name}</h2>
      </header>
      <ChatRoomClient
        roomId={room.id}
        currentUserId={session.user.id}
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
