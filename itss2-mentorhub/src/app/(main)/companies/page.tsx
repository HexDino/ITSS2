import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/ui/empty-state';
import { Pagination } from '@/components/ui/pagination';
import { Search, Building2 } from 'lucide-react';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const t = await getTranslations('companies');
  const tCommon = await getTranslations('common');
  const sp = await searchParams;
  const db = await getEnhancedDb();

  const where = sp.q
    ? {
        OR: [
          { name: { contains: sp.q, mode: 'insensitive' as const } },
          { industry: { contains: sp.q, mode: 'insensitive' as const } },
          { location: { contains: sp.q, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const total = await db.company.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(sp.page) || 1));

  const companies = await db.company.findMany({
    where,
    include: { _count: { select: { jobs: { where: { status: 'OPEN' } } } } },
    orderBy: { name: 'asc' },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>
      <form action="/companies" className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input name="q" defaultValue={sp.q ?? ''} placeholder={t('searchPlaceholder')} className="pl-9" />
      </form>

      {companies.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-6 w-6" />}
          title={t('empty')}
          description={tCommon('noData')}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <Link key={c.id} href={`/companies/${c.slug}`}>
              <Card className="h-full transition-colors hover:border-primary/40">
                <CardHeader className="flex-row items-center gap-3 space-y-0">
                  <Avatar className="h-11 w-11 rounded-md">
                    {c.logo && <AvatarImage src={c.logo} alt={c.name} />}
                    <AvatarFallback className="rounded-md">{initials(c.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">{c.name}</CardTitle>
                    <p className="truncate text-xs text-muted-foreground">{c.industry}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {c.location && <p>{c.location}</p>}
                  <div className="flex items-center justify-between">
                    <Badge variant="tag">{t(`sizes.${c.size}`)}</Badge>
                    <span className="text-xs">{t('openJobs', { count: c._count.jobs })}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        buildHref={(p) => {
          const params = new URLSearchParams();
          if (sp.q) params.set('q', sp.q);
          if (p > 1) params.set('page', String(p));
          const qs = params.toString();
          return qs ? `/companies?${qs}` : '/companies';
        }}
        prevLabel={tCommon('back')}
        nextLabel={tCommon('next')}
      />
    </div>
  );
}
