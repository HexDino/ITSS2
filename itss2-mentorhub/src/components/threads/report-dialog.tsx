'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { reportAction } from '@/app/(main)/threads/actions';

type TargetType = 'THREAD' | 'ANSWER' | 'USER' | 'JOB' | 'MESSAGE';

export function ReportDialog({
  targetType,
  targetId,
  open,
  onOpenChange,
  trigger,
}: {
  targetType: TargetType;
  targetId: string;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations('report');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [pending, start] = useTransition();
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  function submit() {
    if (reason.trim().length < 5) {
      toast({ title: t('reasonMin'), variant: 'destructive' });
      return;
    }
    start(async () => {
      const r = await reportAction({ targetType, targetId, reason: reason.trim() });
      if (!r.ok) {
        const msg = r.error === 'RATE_LIMIT' ? t('rateLimit') : t('error');
        toast({ title: msg, variant: 'destructive' });
        return;
      }
      toast({ title: t('success') });
      setReason('');
      setOpen(false);
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-4 w-4" /> {t('title')}
          </DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="report-reason">{t('reasonLabel')}</Label>
          <Textarea
            id="report-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            maxLength={1000}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

