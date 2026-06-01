import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ChevronRight, MessageSquare, CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/db';
import { sanitizeAnonymous, sanitizeAnonymousList } from '@/lib/anonymous';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('threads');
  const tCommon = await getTranslations('common');
  const db = prisma;

  const raw = await db.thread.findUnique({
    where: { id },
    include: {
      channel: true,
      author: { select: { id: true, name: true, image: true, role: true } },
      answers: {
        include: { author: { select: { id: true, name: true, image: true, role: true } } },
        orderBy: [{ accepted: 'desc' }, { upvotes: 'desc' }, { createdAt: 'asc' }],
      },
    },
  });
  if (!raw) notFound();

  const viewer = { id: undefined, role: undefined };
  const thread = sanitizeAnonymous(raw, viewer);
  const answers = sanitizeAnonymousList(raw.answers, viewer);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/channels" className="hover:text-foreground hover:underline">
          {t('breadcrumbChannels')}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <Link
          href={`/channels/${thread.channel.slug}`}
          className="hover:text-foreground hover:underline"
        >
          {thread.channel.name}
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-foreground/70">{thread.title}</span>
      </nav>

      {/* Question card */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-5 py-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Badge variant="muted" className="uppercase tracking-wide">
              {thread.channel.category}
            </Badge>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{thread.channel.name}</span>
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(thread.createdAt)}</span>
        </div>
        <CardContent className="space-y-4 py-5">
          <h1 className="font-serif text-2xl leading-tight tracking-tight md:text-3xl">
            {thread.title}
          </h1>
          <PersonRow
            isAnonymous={thread.isAnonymous}
            author={thread.author}
            createdAt={thread.createdAt}
          />
          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {thread.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
          <article
            className="prose-claude pt-2"
            dangerouslySetInnerHTML={{ __html: thread.content }}
          />
        </CardContent>
      </Card>

      {/* Answers header */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-serif text-xl">{t('answersCount', { count: answers.length })}</h2>
        </div>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        {answers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{tCommon('noData')}</p>
            </CardContent>
          </Card>
        ) : (
          answers.map((a) => (
            <Card
              key={a.id}
              className={
                a.accepted
                  ? 'overflow-hidden border-primary/40 shadow-sm ring-1 ring-primary/10'
                  : 'overflow-hidden'
              }
            >
              {a.accepted && (
                <div className="flex items-center gap-2 border-b border-primary/30 bg-primary/5 px-5 py-2 text-xs font-medium text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t('acceptedSolution')}
                </div>
              )}
              <CardContent className="space-y-3 py-5">
                <PersonRow
                  isAnonymous={a.isAnonymous}
                  author={a.author}
                  createdAt={a.createdAt}
                />
                <article
                  className="prose-claude"
                  dangerouslySetInnerHTML={{ __html: a.content }}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function PersonRow({
  isAnonymous,
  author,
  createdAt,
}: {
  isAnonymous: boolean;
  author: { id: string; name: string; image: string | null; role: string } | null | undefined;
  createdAt: Date;
}) {
  const displayName = isAnonymous ? null : author?.name;
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <Avatar className="h-8 w-8">
        {!isAnonymous && author?.image && <AvatarImage src={author.image} alt={author.name} />}
        <AvatarFallback>{isAnonymous ? '?' : initials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col leading-tight">
        <span className="font-medium">
          {displayName ?? (
            <span className="italic text-muted-foreground">Người dùng ẩn danh</span>
          )}
        </span>
        <span className="text-xs text-muted-foreground">{formatDate(createdAt)}</span>
      </div>
    </div>
  );
}
