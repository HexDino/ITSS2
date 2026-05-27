import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Briefcase,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate, initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const SIZE_LABEL: Record<string, string> = {
  STARTUP: '1-10',
  SMALL: '11-50',
  MEDIUM: '51-200',
  LARGE: '201-1000',
  ENTERPRISE: '1000+',
};

export default async function CompanyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = await getTranslations('companies');
  const tJobs = await getTranslations('jobs');
  const db = await getEnhancedDb();

  const company = await db.company.findUnique({
    where: { slug },
    include: {
      jobs: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } },
      _count: { select: { jobs: { where: { status: 'OPEN' } }, employers: true } },
    },
  });
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero / cover */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary/20 via-primary/10 to-muted" />
        <CardContent className="space-y-4 pb-6 pt-0">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar className="h-20 w-20 rounded-lg border-4 border-card bg-card">
              {company.logo && <AvatarImage src={company.logo} alt={company.name} />}
              <AvatarFallback className="rounded-lg text-xl">
                {initials(company.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl tracking-tight md:text-3xl">{company.name}</h1>
                {company.verified && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('verified')}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                {company.industry && (
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {company.industry}
                  </span>
                )}
                {company.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.location}
                  </span>
                )}
              </div>
            </div>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Globe className="h-4 w-4" />
                  {t('visitWebsite')}
                </Button>
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
            <Stat icon={<Users className="h-4 w-4" />} label={t('size')} value={SIZE_LABEL[company.size] ?? '—'} />
            <Stat
              icon={<Briefcase className="h-4 w-4" />}
              label={t('openJobsLabel')}
              value={String(company._count.jobs)}
            />
            <Stat
              icon={<CheckCircle2 className="h-4 w-4" />}
              label={t('verified')}
              value={company.verified ? '✓' : '—'}
            />
          </div>
        </CardContent>
      </Card>

      {/* About */}
      {company.description && (
        <Card>
          <CardContent className="space-y-2 py-5">
            <h2 className="font-serif text-lg">{t('about')}</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
              {company.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Open jobs */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">{t('openJobsHeading')}</h2>
          <span className="text-xs text-muted-foreground">
            {t('openJobs', { count: company._count.jobs })}
          </span>
        </div>

        {company.jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t('noJobs')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {company.jobs.map((j) => (
              <Link key={j.id} href={`/jobs/${j.id}`} className="block">
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="space-y-2 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-medium leading-snug">{j.title}</p>
                      <Badge variant="muted" className="shrink-0">{j.type}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {j.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {j.location}
                        </span>
                      )}
                      {j.deadline && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {tJobs('deadline')}: {formatDate(j.deadline)}
                        </span>
                      )}
                    </div>
                    {j.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {j.tags.slice(0, 5).map((tg) => (
                          <Badge key={tg} variant="outline" className="text-[10px]">
                            #{tg}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
