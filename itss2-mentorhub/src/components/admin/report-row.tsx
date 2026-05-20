'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { resolveReportAction } from '@/app/(main)/admin/actions';

export function AdminReportRow({ reportId }: { reportId: string }) {
  const t = useTranslations('admin');
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => start(() => resolveReportAction(reportId, 'RESOLVED'))} disabled={pending}>
        {t('approve')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => start(() => resolveReportAction(reportId, 'DISMISSED'))} disabled={pending}>
        {t('reject')}
      </Button>
    </div>
  );
}
