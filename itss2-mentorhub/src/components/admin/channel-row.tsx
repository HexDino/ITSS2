'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { approveChannelAction } from '@/app/(main)/admin/actions';

export function AdminChannelRow({ channelId }: { channelId: string }) {
  const t = useTranslations('admin');
  const [pending, start] = useTransition();
  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={() => start(() => approveChannelAction(channelId, true))} disabled={pending}>
        {t('approve')}
      </Button>
      <Button size="sm" variant="outline" onClick={() => start(() => approveChannelAction(channelId, false))} disabled={pending}>
        {t('reject')}
      </Button>
    </div>
  );
}
