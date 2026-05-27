import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { JobForm } from '@/components/employer/job-form';
import { JobStatusControl } from '@/components/employer/job-status-control';
import { ApplicationStatusControl } from '@/components/employer/application-status-control';
import { CreateCompanyForm } from '@/components/employer/create-company-form';

export const dynamic = 'force-dynamic';

export default async function EmployerPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'EMPLOYER' && session.user.role !== 'ADMIN') redirect('/channels');

  const t = await getTranslations('employer');

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    include: { company: true },
  });

  if (!employerProfile?.companyId) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <header>
          <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('noCompanyBody')}</p>
        </header>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('createCompanyTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateCompanyForm />
          </CardContent>
        </Card>
      </div>
    );
  }

  const companyId = employerProfile.companyId;
  const company = employerProfile.company;

  const jobs = await prisma.job.findMany({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { applications: true } } },
  });

  const applications = await prisma.application.findMany({
    where: { job: { companyId } },
    orderBy: { createdAt: 'desc' },
    include: {
      job: { select: { id: true, title: true } },
      student: { select: { id: true, name: true, email: true } },
      studentProfile: { select: { university: true, major: true, cvUrl: true, skills: true } },
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl tracking-tight">{company?.name}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
          {company && !company.verified && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">{t('pendingApproval')}</p>
          )}
        </div>
      </header>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">{t('tabJobs', { count: jobs.length })}</TabsTrigger>
          <TabsTrigger value="applications">
            {t('tabApplications', { count: applications.length })}
          </TabsTrigger>
          <TabsTrigger value="new">{t('tabNew')}</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-3">
          {jobs.length === 0 ? (
            <p className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
              {t('emptyJobs')}
            </p>
          ) : (
            jobs.map((j) => (
              <Card key={j.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 pb-2">
                  <div>
                    <CardTitle className="text-base">
                      <Link href={`/jobs/${j.id}`} className="hover:text-primary">
                        {j.title}
                      </Link>
                    </CardTitle>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="muted">{j.type}</Badge>
                      <span>·</span>
                      <span>{j.location || '—'}</span>
                      <span>·</span>
                      <span>
                        {j._count.applications} {t('candidates')}
                      </span>
                      <span>·</span>
                      <span>{formatDate(j.createdAt)}</span>
                    </div>
                  </div>
                  <JobStatusControl jobId={j.id} status={j.status} />
                </CardHeader>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-3">
          {applications.length === 0 ? (
            <p className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
              {t('emptyApplications')}
            </p>
          ) : (
            applications.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{a.student.name}</CardTitle>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {a.student.email} · {a.studentProfile?.university ?? '—'} ·{' '}
                        {a.studentProfile?.major ?? '—'}
                      </div>
                      <div className="mt-1 text-xs">
                        {t('appliedFor')}{' '}
                        <Link href={`/jobs/${a.job.id}`} className="text-primary">
                          {a.job.title}
                        </Link>{' '}
                        · {formatDate(a.createdAt)}
                      </div>
                    </div>
                    <ApplicationStatusControl applicationId={a.id} status={a.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {a.studentProfile?.skills && a.studentProfile.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {a.studentProfile.skills.map((s) => (
                        <Badge key={s} variant="outline" className="text-xs">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {a.coverLetter && (
                    <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                      {a.coverLetter}
                    </div>
                  )}
                  {(a.cvSnapshotUrl ?? a.studentProfile?.cvUrl) && (
                    <Button asChild variant="outline" size="sm">
                      <a
                        href={(a.cvSnapshotUrl ?? a.studentProfile?.cvUrl) as string}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t('viewCv')}
                      </a>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardContent className="py-6">
              <JobForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
