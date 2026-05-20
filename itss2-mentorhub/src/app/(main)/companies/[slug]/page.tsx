import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations('companies');
  const tJobs = await getTranslations('jobs');
  const db = await getEnhancedDb();

  const company = await db.company.findUnique({
    where: { slug },
    include: { jobs: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } } },
  });
  if (!company) notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="h-16 w-16 rounded-md">
            {company.logo && <AvatarImage src={company.logo} alt={company.name} />}
            <AvatarFallback className="rounded-md text-lg">{initials(company.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="font-serif text-2xl">{company.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {company.industry} {company.location && `· ${company.location}`}
            </p>
            <div className="flex gap-2">
              <Badge variant="muted">{company.size}</Badge>
              {company.verified && <Badge variant="success">{t('industry')}</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
              {company.website}
            </a>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="space-y-3">
        <h2 className="font-serif text-xl">{tJobs('title')}</h2>
        {company.jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">—</p>
        ) : (
          company.jobs.map((j) => (
            <Link key={j.id} href={`/jobs/${j.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="font-medium">{j.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {j.type} {j.location && `· ${j.location}`}
                    </p>
                  </div>
                  <Badge variant="muted">{j.type}</Badge>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
