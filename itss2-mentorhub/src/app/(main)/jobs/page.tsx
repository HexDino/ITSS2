import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Briefcase } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string }>;
}

export default async function JobsPage({ searchParams }: PageProps) {
  const t = await getTranslations('jobs');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const db = await getEnhancedDb();

  const where = {
    status: 'OPEN' as const,
    ...(sp.type && sp.type !== 'ALL' ? { type: sp.type as any } : {}),
  };

  const [jobs, total] = await Promise.all([
    db.job.findMany({
      where,
      include: { company: { select: { name: true, logo: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.job.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = sp.type && sp.type !== 'ALL' ? `&type=${sp.type}` : '';

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {['ALL', 'INTERNSHIP', 'JUNIOR', 'PARTTIME', 'FULLTIME'].map((typ) => {
          const active = (sp.type ?? 'ALL') === typ;
          return (
            <Link
              key={typ}
              href={typ === 'ALL' ? '/jobs' : `/jobs?type=${typ}`}
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
            title="Chưa có việc nào phù hợp"
            description="Thử bỏ bộ lọc hoặc quay lại sau."
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
              href={`/jobs?page=${page - 1}${qs}`}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              ← Trước
            </Link>
          ) : null}
          <span className="text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/jobs?page=${page + 1}${qs}`}
              className="rounded-md border border-border px-3 py-1 hover:bg-accent"
            >
              Sau →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
