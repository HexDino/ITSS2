import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CreateChannelDialog } from '@/components/channels/create-channel-dialog';
import { Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function ChannelsPage({ searchParams }: PageProps) {
  const t = await getTranslations('channels');
  const sp = await searchParams;
  const db = await getEnhancedDb();

  const channels = await db.channel.findMany({
    where: {
      ...(sp.q
        ? {
            OR: [
              { name: { contains: sp.q, mode: 'insensitive' } },
              { description: { contains: sp.q, mode: 'insensitive' } },
              { tags: { has: sp.q } },
            ],
          }
        : {}),
      ...(sp.category && sp.category !== 'ALL' ? { category: sp.category as any } : {}),
    },
    include: { _count: { select: { threads: true } } },
    orderBy: [{ createdAt: 'desc' }],
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <CreateChannelDialog />
      </header>

      <form action="/channels" className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={sp.q ?? ''} placeholder={t('searchPlaceholder')} className="pl-9" />
      </form>

      {channels.length === 0 ? (
        <p className="rounded-md border border-dashed border-border py-12 text-center text-muted-foreground">
          {t('empty')}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((c) => (
            <Link key={c.id} href={`/channels/${c.slug}`} className="group">
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base group-hover:text-primary">{c.name}</CardTitle>
                    <Badge variant="muted">{c.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {c.tags.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {c._count.threads} {t('threads')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
