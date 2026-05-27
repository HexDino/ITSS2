import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Briefcase, Search } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string; q?: string; sort?: string }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const t = await getTranslations('jobs');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? '').trim().slice(0, 100);
  const sort = sp.sort === 'deadline' ? 'deadline' : 'recent';
  const db = await getEnhancedDb();

  const where = {
    status: 'OPEN' as const,
    ...(sp.type && sp.type !== 'ALL' ? { type: sp.type as any } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' as const } },
            { description: { contains: q, mode: 'insensitive' as const } },
            { tags: { has: q } },
            { company: { is: { name: { contains: q, mode: 'insensitive' as const } } } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === 'deadline'
      ? [{ deadline: 'asc' as const }, { createdAt: 'desc' as const }]
      : [{ createdAt: 'desc' as const }];

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      include: { company: { select: { name: true, logo: true, slug: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.job.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildQuery = (overrides: Record<string, string | undefined>) => {
    const merged: Record<string, string> = {};
    if (sp.type && sp.type !== 'ALL') merged.type = sp.type;
    if (q) merged.q = q;
    if (sort !== 'recent') merged.sort = sort;
    for (const [k, v] of Object.entries(overrides)) {
      if (v === undefined || v === '') delete merged[k];
      else merged[k] = v;
    }
    const s = new URLSearchParams(merged).toString();
    return s ? `?${s}` : '';
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      <form method="GET" className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input name="q" defaultValue={q} placeholder={t('searchPlaceholder')} maxLength={100} className="pl-9" />
        </div>
        {sp.type && sp.type !== 'ALL' ? <input type="hidden" name="type" value={sp.type} /> : null}
        <select
          name="sort"
          defaultValue={sort}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="recent">{t('sortRecent')}</option>
          <option value="deadline">{t('sortDeadline')}</option>
        </select>
      </form>

      <div className="flex flex-wrap gap-2">
        {['ALL', 'INTERNSHIP', 'JUNIOR', 'PARTTIME', 'FULLTIME'].map((typ) => {
          const active = (sp.type ?? 'ALL') === typ;
          return (
            <Link
              key={typ}
              href={`/jobs${buildQuery({ type: typ === 'ALL' ? undefined : typ, page: undefined })}`}
              className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {typ === 'INTERNSHIP' ? t('internship') : typ === 'JUNIOR' ? t('junior') : typ}
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {jobs.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-6 w-6" />}
            title={t('emptyTitle')}
            description={t('emptyHint')}
          />
        ) : (
          jobs.map((j) => (
          <Link key={j.id} href={`/jobs/${j.id}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{j.title}</CardTitle>
                  <Badge variant="muted">{j.type}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {j.company.name} {j.location && `· ${j.location}`}
                </p>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex flex-wrap gap-1.5">
                  {j.tags.slice(0, 5).map((tag) => (
                    <Badge key={tag} variant="tag" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                {j.deadline && <span>{t('deadline')}: {formatDate(j.deadline)}</span>}
              </CardContent>
            </Card>
          </Link>
          ))
        )}
      </div>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2 pt-2 text-sm">
          {page > 1 ? (
            <Link
              href={`/jobs${buildQuery({ page: String(page - 1) })}`}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              ←
            </Link>
          ) : null}
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/jobs${buildQuery({ page: String(page + 1) })}`}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
