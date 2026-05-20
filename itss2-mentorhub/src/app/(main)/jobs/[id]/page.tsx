import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate } from '@/lib/utils';
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
  if (session?.user?.role === 'STUDENT') {
    alreadyApplied = !!(await db.application.findFirst({
      where: { jobId: job.id, studentId: session.user.id },
      select: { id: true },
    }));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-serif text-2xl">{job.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {job.company.name} {job.location && `· ${job.location}`}
              </p>
            </div>
            <Badge variant="muted">{job.type}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-1">
            {job.tags.map((tg) => (
              <Badge key={tg} variant="outline" className="text-xs">
                {tg}
              </Badge>
            ))}
          </div>
          {job.deadline && (
            <p className="text-xs text-muted-foreground">
              {t('deadline')}: {formatDate(job.deadline)}
            </p>
          )}
          <Separator />
          <Block title={t('description')} body={job.description} />
          {job.requirements && <Block title={t('requirements')} body={job.requirements} />}
          {job.benefits && <Block title={t('benefits')} body={job.benefits} />}
          {session?.user?.role === 'STUDENT' && (
            <div className="pt-2">
              <ApplyButton jobId={job.id} alreadyApplied={alreadyApplied} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="prose-claude" dangerouslySetInnerHTML={{ __html: body }} />
    </section>
  );
}
