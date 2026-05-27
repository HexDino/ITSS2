import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      _count: {
        select: {
          messages: {
            where: { senderId: { not: session.user.id }, readAt: null },
          },
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Link href="/mentors">
          <Button variant="outline" size="sm">
            {t('findMentor')}
          </Button>
        </Link>
      </div>
      {rooms.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">{t('empty')}</p>
            <Link href="/mentors">
              <Button>{t('findMentor')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {rooms.map((r) => {
            const other = r.userA.id === session.user.id ? r.userB : r.userA;
            const last = r.messages[0];
            const unread = r._count.messages;
            return (
              <Link key={r.id} href={`/chat/${r.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 py-3">
                    <Avatar className="h-10 w-10">
                      {other.image && <AvatarImage src={other.image} alt={other.name} />}
                      <AvatarFallback>{initials(other.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium">{other.name}</p>
                        {unread > 0 && (
                          <Badge
                            variant="default"
                            className="h-5 min-w-[1.25rem] justify-center px-1.5 text-[10px]"
                          >
                            {unread}
                          </Badge>
                        )}
                      </div>
                      {last ? (
                        <p
                          className={`truncate text-xs ${
                            unread > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {last.senderId === session.user.id ? `${t('youPrefix')} ` : ''}
                          {last.content} · {formatDate(last.createdAt)}
                        </p>
                      ) : (
                        <p className="truncate text-xs text-muted-foreground">{t('noMessages')}</p>
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
