'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { FileText, AlertCircle } from 'lucide-react';
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

const ERROR_KEYS: Record<string, string> = {
  ONLY_STUDENT: 'errors.onlyStudent',
  INVALID: 'errors.invalid',
  JOB_NOT_FOUND: 'errors.jobNotFound',
  JOB_CLOSED: 'errors.jobClosed',
  ALREADY_APPLIED: 'errors.alreadyApplied',
  APPLY_FAILED: 'errors.applyFailed',
  RATE_LIMIT: 'errors.rateLimit',
};

export function ApplyButton({
  jobId,
  alreadyApplied,
  hasCv = false,
}: {
  jobId: string;
  alreadyApplied: boolean;
  hasCv?: boolean;
}) {
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
        toast({ title: t('applySuccess') });
        setOpen(false);
        setLetter('');
      } else {
        const key = ERROR_KEYS[res.error] ?? 'errors.applyFailed';
        toast({ title: t(key), variant: 'destructive' });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">{t('applyNow')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('applyNow')}</DialogTitle>
        </DialogHeader>

        {!hasCv && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300/50 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-900/10">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="space-y-1">
              <p>{t('noCvWarning')}</p>
              <Link href="/profile" className="text-xs font-medium text-primary hover:underline">
                {t('goToProfile')}
              </Link>
            </div>
          </div>
        )}

        {hasCv && (
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>{t('cvAttached')}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="letter">{t('coverLetter')}</Label>
          <Textarea
            id="letter"
            rows={6}
            value={letter}
            maxLength={5000}
            placeholder={t('coverLetterPlaceholder')}
            onChange={(e) => setLetter(e.target.value)}
          />
          <p className="text-right text-xs text-muted-foreground">{letter.length}/5000</p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? tCommon('loading') : tCommon('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
