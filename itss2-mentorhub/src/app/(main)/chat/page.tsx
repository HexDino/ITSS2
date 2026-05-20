import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ChatPage() {
  const t = await getTranslations('chat');
  const session = await auth();
  if (!session?.user) return null;
  const db = await getEnhancedDb();

  const rooms = await db.chatRoom.findMany({
    include: {
      userA: { select: { id: true, name: true, image: true } },
      userB: { select: { id: true, name: true, image: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
      {rooms.length === 0 ? (
        <p className="rounded-md border border-dashed border-border py-12 text-center text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <div className="space-y-2">
          {rooms.map((r) => {
            const other = r.userA.id === session.user.id ? r.userB : r.userA;
            const last = r.messages[0];
            return (
              <Link key={r.id} href={`/chat/${r.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9">
                      {other.image && <AvatarImage src={other.image} alt={other.name} />}
                      <AvatarFallback>{initials(other.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{other.name}</p>
                      {last && (
                        <p className="truncate text-xs text-muted-foreground">
                          {last.content} · {formatDate(last.createdAt)}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
