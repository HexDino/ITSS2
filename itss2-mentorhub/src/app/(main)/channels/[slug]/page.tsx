import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { auth } from '@/lib/auth';
import { sanitizeAnonymousList } from '@/lib/anonymous';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { MessagesSquare } from 'lucide-react';
import { NewThreadDialog } from '@/components/threads/new-thread-dialog';
import { formatDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function ChannelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const t = await getTranslations('threads');
  const session = await auth();
  const db = await getEnhancedDb();

  const channel = await db.channel.findUnique({ where: { slug } });
  if (!channel) notFound();

  const [rawThreads, totalThreads] = await Promise.all([
    db.thread.findMany({
      where: { channelId: channel.id },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
        _count: { select: { answers: true } },
      },
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.thread.count({ where: { channelId: channel.id } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalThreads / PAGE_SIZE));

  const threads = sanitizeAnonymousList(rawThreads, { id: session?.user?.id, role: session?.user?.role });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="muted">{channel.category}</Badge>
            <h1 className="font-serif text-2xl tracking-tight">{channel.name}</h1>
          </div>
          {channel.description && <p className="max-w-2xl text-muted-foreground">{channel.description}</p>}
          <div className="flex flex-wrap gap-1">
            {channel.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <NewThreadDialog channelId={channel.id} channelSlug={channel.slug} />
      </header>

      <div className="space-y-3">
        {threads.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="h-6 w-6" />}
            title="Chưa có thảo luận nào"
            description="Hãy là người đầu tiên đặt câu hỏi trong kênh này."
          />
        ) : (
          threads.map((th) => {
            const displayName = th.isAnonymous ? null : th.author?.name;
            return (
              <Link key={th.id} href={`/threads/${th.id}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex gap-4 py-4">
                    <Avatar className="h-9 w-9">
                      {!th.isAnonymous && th.author?.image && <AvatarImage src={th.author.image} alt={th.author.name} />}
                      <AvatarFallback>{th.isAnonymous ? '?' : initials(displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-1 font-medium">{th.title}</h3>
                        {th.pinned && <Badge variant="default">Pinned</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {displayName ?? <span className="italic">Người dùng ẩn danh</span>} · {formatDate(th.createdAt)} ·{' '}
                        {t('answersCount', { count: th._count.answers })}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {th.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2 pt-2 text-sm">
          {page > 1 ? (
            <Link href={`/channels/${slug}?page=${page - 1}`} className="rounded-md border border-border px-3 py-1 hover:bg-accent">
              ← Trước
            </Link>
          ) : null}
          <span className="text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={`/channels/${slug}?page=${page + 1}`} className="rounded-md border border-border px-3 py-1 hover:bg-accent">
              Sau →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
