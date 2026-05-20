'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { applyToJobAction } from '@/app/(main)/jobs/actions';

export function ApplyButton({ jobId, alreadyApplied }: { jobId: string; alreadyApplied: boolean }) {
  const t = useTranslations('jobs');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [letter, setLetter] = useState('');
  const [pending, start] = useTransition();

  if (alreadyApplied) {
    return (
      <Button disabled variant="outline">
        {t('applied')}
      </Button>
    );
  }

  function submit() {
    start(async () => {
      const res = await applyToJobAction({ jobId, coverLetter: letter });
      if (res.ok) {
        toast({ title: t('applied') });
        setOpen(false);
      } else {
        toast({ title: res.error, variant: 'destructive' });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{t('applyNow')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('applyNow')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="letter">Cover letter</Label>
          <Textarea
            id="letter"
            rows={6}
            value={letter}
            maxLength={5000}
            onChange={(e) => setLetter(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {tCommon('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
