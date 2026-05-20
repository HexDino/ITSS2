import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'muted' | 'outline'> = {
  RECEIVED: 'muted',
  REVIEWING: 'default',
  INTERVIEW: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'outline',
};

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

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
      <div className="space-y-3">
        {apps.map((a) => (
          <Link key={a.id} href={`/jobs/${a.jobId}`}>
            <Card className="transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{a.job.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.job.company.name} · {formatDate(a.createdAt)}
                  </p>
                </div>
                <Badge variant={statusVariant[a.status] ?? 'muted'}>{t(`status.${a.status}`)}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
