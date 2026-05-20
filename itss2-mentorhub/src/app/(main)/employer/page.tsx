import { redirect } from 'next/navigation';
import Link from 'next/link';
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

export const dynamic = 'force-dynamic';

export default async function EmployerPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'EMPLOYER' && session.user.role !== 'ADMIN') redirect('/channels');

  const employerProfile = await prisma.employerProfile.findUnique({
    where: { userId: session.user.id },
    include: { company: true },
  });

  if (!employerProfile?.companyId) {
    return (
      <div className="max-w-2xl space-y-4">
        <h1 className="font-serif text-3xl tracking-tight">Khu vực nhà tuyển dụng</h1>
        <Card>
          <CardContent className="py-6 text-sm">
            Tài khoản của bạn chưa được liên kết với một công ty. Liên hệ quản trị viên hoặc cập
            nhật hồ sơ doanh nghiệp ở trang{' '}
            <Link href="/profile" className="text-primary underline">
              hồ sơ
            </Link>
            .
          </CardContent>
        </Card>
      </div>
    );
  }

  const companyId = employerProfile.companyId;

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
          <h1 className="font-serif text-3xl tracking-tight">{employerProfile.company?.name}</h1>
          <p className="text-muted-foreground">Quản lý tin tuyển dụng & hồ sơ ứng viên</p>
        </div>
      </header>

      <Tabs defaultValue="jobs">
        <TabsList>
          <TabsTrigger value="jobs">Tin tuyển dụng ({jobs.length})</TabsTrigger>
          <TabsTrigger value="applications">Hồ sơ ứng tuyển ({applications.length})</TabsTrigger>
          <TabsTrigger value="new">+ Đăng tin mới</TabsTrigger>
        </TabsList>

        <TabsContent value="jobs" className="space-y-3">
          {jobs.length === 0 ? (
            <p className="rounded-md border border-dashed py-12 text-center text-muted-foreground">
              Chưa có tin tuyển dụng nào.
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
                      <span>{j._count.applications} ứng viên</span>
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
              Chưa có ứng viên.
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
                        Ứng tuyển vào{' '}
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
                        Xem CV
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
