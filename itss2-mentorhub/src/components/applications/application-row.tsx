'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { withdrawApplicationAction } from '@/app/(main)/applications/actions';

type Status = 'RECEIVED' | 'REVIEWING' | 'INTERVIEW' | 'ACCEPTED' | 'REJECTED';

const statusVariant: Record<Status, 'default' | 'success' | 'warning' | 'muted' | 'outline'> = {
  RECEIVED: 'muted',
  REVIEWING: 'default',
  INTERVIEW: 'warning',
  ACCEPTED: 'success',
  REJECTED: 'outline',
};

export interface ApplicationRowData {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  status: Status;
  coverLetter: string | null;
  note: string | null;
  cvSnapshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ApplicationRow({ data }: { data: ApplicationRowData }) {
  const t = useTranslations('applications');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const canWithdraw = data.status === 'RECEIVED' || data.status === 'REVIEWING';

  function withdraw() {
    if (!window.confirm(t('confirmWithdraw'))) return;
    start(async () => {
      const res = await withdrawApplicationAction({ applicationId: data.id });
      if (res.ok) {
        toast({ title: t('withdrawn') });
      } else {
        toast({ title: res.error, variant: 'destructive' });
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/jobs/${data.jobId}`} className="font-medium hover:underline">
              {data.jobTitle}
            </Link>
            <p className="text-xs text-muted-foreground">
              {data.companyName} · {t('appliedAt')}: {formatDate(data.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariant[data.status]}>{t(`status.${data.status}`)}</Badge>
            <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
              {open ? t('hideDetail') : t('viewDetail')}
            </Button>
          </div>
        </div>

        {open && (
          <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3 text-sm">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {t('lastUpdate')}: {formatDate(data.updatedAt)}
              </span>
              {data.cvSnapshotUrl && (
                <a
                  href={data.cvSnapshotUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {t('viewCv')}
                </a>
              )}
            </div>

            <section>
              <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('coverLetter')}
              </h4>
              {data.coverLetter ? (
                <p className="whitespace-pre-wrap break-words">{data.coverLetter}</p>
              ) : (
                <p className="text-muted-foreground">{t('noCoverLetter')}</p>
              )}
            </section>

            {data.note && (
              <section>
                <h4 className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t('employerNote')}
                </h4>
                <p className="whitespace-pre-wrap break-words">{data.note}</p>
              </section>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Link href={`/jobs/${data.jobId}`}>
                <Button variant="outline" size="sm">
                  {t('viewJob')}
                </Button>
              </Link>
              {canWithdraw && (
                <Button variant="destructive" size="sm" disabled={pending} onClick={withdraw}>
                  {pending ? tCommon('loading') : t('withdraw')}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
}
