import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Briefcase, MapPin, Calendar, Building2, Clock } from 'lucide-react';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { prisma } from '@/lib/db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDate, initials } from '@/lib/utils';
import { ApplyButton } from '@/components/jobs/apply-button';

export const dynamic = 'force-dynamic';

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('jobs');
  const session = await auth();
  const db = await getEnhancedDb();

  const job = await db.job.findUnique({
    where: { id },
    include: { company: true },
  });
  if (!job) notFound();

  let alreadyApplied = false;
  let hasCv = false;
  if (session?.user?.role === 'STUDENT') {
    const [app, profile] = await Promise.all([
      db.application.findFirst({
        where: { jobId: job.id, studentId: session.user.id },
        select: { id: true },
      }),
      prisma.studentProfile.findUnique({
        where: { userId: session.user.id },
        select: { cvUrl: true },
      }),
    ]);
    alreadyApplied = !!app;
    hasCv = !!profile?.cvUrl;
  }

  const deadlinePassed = job.deadline ? new Date(job.deadline) < new Date() : false;
  const daysLeft = job.deadline
    ? Math.max(
        0,
        Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      )
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <nav className="text-xs text-muted-foreground">
        <Link href="/jobs" className="hover:text-foreground hover:underline">
          {t('title')}
        </Link>
        <span className="px-1.5">/</span>
        <span className="text-foreground/70">{job.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Header card */}
          <Card className="overflow-hidden">
            <CardContent className="space-y-4 py-6">
              <div className="flex items-start gap-4">
                <Link href={`/companies/${job.company.slug}`} className="shrink-0">
                  <Avatar className="h-14 w-14 rounded-md">
                    {job.company.logo && (
                      <AvatarImage src={job.company.logo} alt={job.company.name} />
                    )}
                    <AvatarFallback className="rounded-md">
                      {initials(job.company.name)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="min-w-0 flex-1">
                  <h1 className="font-serif text-2xl leading-tight tracking-tight md:text-3xl">
                    {job.title}
                  </h1>
                  <Link
                    href={`/companies/${job.company.slug}`}
                    className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {job.company.name}
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="muted" className="gap-1">
                  <Briefcase className="h-3 w-3" />
                  {job.type}
                </Badge>
                {job.location && (
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="h-3 w-3" />
                    {job.location}
                  </Badge>
                )}
                {job.deadline && (
                  <Badge
                    variant={deadlinePassed ? 'outline' : 'warning'}
                    className="gap-1"
                  >
                    <Calendar className="h-3 w-3" />
                    {t('deadline')}: {formatDate(job.deadline)}
                  </Badge>
                )}
              </div>

              {job.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {job.tags.map((tg) => (
                    <Badge key={tg} variant="outline" className="text-xs">
                      #{tg}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description / requirements / benefits */}
          <Card>
            <CardContent className="space-y-6 py-6">
              <Block title={t('description')} body={job.description} />
              {job.requirements && <Block title={t('requirements')} body={job.requirements} />}
              {job.benefits && <Block title={t('benefits')} body={job.benefits} />}
            </CardContent>
          </Card>
        </div>

        {/* Side column */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardContent className="space-y-4 py-5">
              {session?.user?.role === 'STUDENT' ? (
                <ApplyButton
                  jobId={job.id}
                  alreadyApplied={alreadyApplied}
                  hasCv={hasCv}
                />
              ) : !session?.user ? (
                <Link href="/login" className="block">
                  <Button className="w-full" size="lg">
                    {t('loginToApply')}
                  </Button>
                </Link>
              ) : (
                <Button disabled variant="outline" className="w-full">
                  {t('studentOnly')}
                </Button>
              )}

              <div className="space-y-2 text-sm">
                {daysLeft !== null && !deadlinePassed && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{t('daysLeft', { days: daysLeft })}</span>
                  </div>
                )}
                {deadlinePassed && (
                  <p className="text-sm font-medium text-destructive">{t('deadlinePassed')}</p>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  <span>{job.type}</span>
                </div>
                {job.location && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 py-5">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-md">
                  {job.company.logo && (
                    <AvatarImage src={job.company.logo} alt={job.company.name} />
                  )}
                  <AvatarFallback className="rounded-md text-sm">
                    {initials(job.company.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{job.company.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {job.company.industry}
                  </p>
                </div>
              </div>
              <Link href={`/companies/${job.company.slug}`} className="block">
                <Button variant="outline" className="w-full" size="sm">
                  {t('viewCompany')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <section className="space-y-2">
      <h3 className="font-serif text-lg">{title}</h3>
      <div className="prose-claude" dangerouslySetInnerHTML={{ __html: body }} />
    </section>
  );
}
