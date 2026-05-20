import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { prisma } from '@/lib/db';
import { auth } from '@/lib/auth';
import { sanitizeAnonymous, sanitizeAnonymousList } from '@/lib/anonymous';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AnswerDialog } from '@/components/threads/answer-dialog';
import { AnswerToolbar } from '@/components/threads/answer-toolbar';
import { formatDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ThreadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('threads');
  const tCommon = await getTranslations('common');
  const session = await auth();
  const db = await getEnhancedDb();

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

  // Load this user's votes on these answers (only for authenticated viewers).
  const myVotes = session?.user
    ? new Set(
        (
          await prisma.answerVote.findMany({
            where: {
              userId: session.user.id,
              answerId: { in: raw.answers.map((a) => a.id) },
            },
            select: { answerId: true },
          })
        ).map((v) => v.answerId),
      )
    : new Set<string>();

  const viewer = { id: session?.user?.id, role: session?.user?.role };
  const thread = sanitizeAnonymous(raw, viewer);
  const answers = sanitizeAnonymousList(raw.answers, viewer);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Badge variant="muted">{thread.channel.category}</Badge>
          <span>·</span>
          <span>{thread.channel.name}</span>
        </div>
        <h1 className="font-serif text-2xl tracking-tight">{thread.title}</h1>
        <PersonRow
          isAnonymous={thread.isAnonymous}
          author={thread.author}
          createdAt={thread.createdAt}
        />
        <div className="flex flex-wrap gap-1">
          {thread.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="py-5">
          <article className="prose-claude" dangerouslySetInnerHTML={{ __html: thread.content }} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-xl">{t('answersCount', { count: answers.length })}</h2>
        <AnswerDialog threadId={thread.id} />
      </div>

      <Separator />

      <div className="space-y-4">
        {answers.length === 0 ? (
          <p className="rounded-md border border-dashed border-border py-10 text-center text-muted-foreground">
            {tCommon('noData')}
          </p>
        ) : (
          answers.map((a) => (
            <Card key={a.id} className={a.accepted ? 'border-primary/40' : undefined}>
              <CardHeader className="pb-2">
                <PersonRow isAnonymous={a.isAnonymous} author={a.author} createdAt={a.createdAt} />
                {a.accepted && <Badge variant="success">Accepted</Badge>}
              </CardHeader>
              <CardContent>
                <article className="prose-claude" dangerouslySetInnerHTML={{ __html: a.content }} />
                <AnswerToolbar
                  answerId={a.id}
                  upvotes={a.upvotes}
                  accepted={a.accepted}
                  voted={myVotes.has(a.id)}
                  canAccept={
                    !!session?.user &&
                    (session.user.id === raw.authorId || session.user.role === 'ADMIN')
                  }
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
    <div className="flex items-center gap-2 text-sm">
      <Avatar className="h-7 w-7">
        {!isAnonymous && author?.image && <AvatarImage src={author.image} alt={author.name} />}
        <AvatarFallback>{isAnonymous ? '?' : initials(displayName)}</AvatarFallback>
      </Avatar>
      <span className="font-medium">
        {displayName ?? <span className="italic text-muted-foreground">Người dùng ẩn danh</span>}
      </span>
      <span className="text-muted-foreground">· {formatDate(createdAt)}</span>
    </div>
  );
}
