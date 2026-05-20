import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function CompaniesPage({ searchParams }: PageProps) {
  const t = await getTranslations('companies');
  const sp = await searchParams;
  const db = await getEnhancedDb();

  const companies = await db.company.findMany({
    where: sp.q
      ? {
          OR: [
            { name: { contains: sp.q, mode: 'insensitive' } },
            { industry: { contains: sp.q, mode: 'insensitive' } },
            { location: { contains: sp.q, mode: 'insensitive' } },
          ],
        }
      : {},
    include: { _count: { select: { jobs: { where: { status: 'OPEN' } } } } },
    orderBy: { name: 'asc' },
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
                  <Badge variant="muted">{c.size}</Badge>
                  <span className="text-xs">{t('openJobs', { count: c._count.jobs })}</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
