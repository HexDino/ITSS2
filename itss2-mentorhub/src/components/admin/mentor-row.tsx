'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { verifyMentorAction } from '@/app/(main)/admin/actions';

export function AdminMentorRow({ mentorId }: { mentorId: string }) {
  const t = useTranslations('admin');
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => start(() => verifyMentorAction(mentorId, true))} disabled={pending}>
        {t('approve')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => start(() => verifyMentorAction(mentorId, false))} disabled={pending}>
        {t('reject')}
      </Button>
    </div>
  );
}
