import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ApplicationRow } from '@/components/applications/application-row';

export const dynamic = 'force-dynamic';

export default async function ApplicationsPage() {
  const t = await getTranslations('applications');
  const session = await auth();
  if (!session?.user || session.user.role !== 'STUDENT') {
    return <p className="text-muted-foreground">—</p>;
  }
  const db = await getEnhancedDb();

  const apps = await db.application.findMany({
    where: { studentId: session.user.id },
    include: { job: { include: { company: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  const counts = {
    total: apps.length,
    active: apps.filter((a) => a.status === 'RECEIVED' || a.status === 'REVIEWING').length,
    interview: apps.filter((a) => a.status === 'INTERVIEW').length,
    accepted: apps.filter((a) => a.status === 'ACCEPTED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      {apps.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={t('summary.total')} value={counts.total} />
          <StatTile label={t('summary.active')} value={counts.active} />
          <StatTile label={t('summary.interview')} value={counts.interview} />
          <StatTile label={t('summary.accepted')} value={counts.accepted} />
        </div>
      )}

      {apps.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-muted-foreground">{t('empty')}</p>
            <Link href="/jobs">
              <Button>{t('browseJobs')}</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map((a) => (
            <ApplicationRow
              key={a.id}
              data={{
                id: a.id,
                jobId: a.jobId,
                jobTitle: a.job.title,
                companyName: a.job.company.name,
                status: a.status as 'RECEIVED' | 'REVIEWING' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED',
                coverLetter: a.coverLetter,
                note: a.note,
                cvSnapshotUrl: a.cvSnapshotUrl,
                createdAt: a.createdAt.toISOString(),
                updatedAt: a.updatedAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
