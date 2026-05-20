'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RichEditor } from '@/components/editor/rich-editor';
import { useToast } from '@/components/ui/toast';
import { htmlPlainLength } from '@/lib/utils';
import { createAnswerAction } from '@/app/(main)/threads/actions';

interface AnswerDialogProps {
  threadId: string;
  trigger?: React.ReactNode;
}

const MAX_CHARS = 40000;

/**
 * Pop-up "Viết câu trả lời" — implements acceptance criteria #2:
 * - Rich text editor (TipTap)
 * - Anonymous toggle switch (default: OFF = anonymous, ON = public)
 * - Cancel discards content; Submit posts via createAnswerAction
 * - Validates empty + 40,000 char limit
 */
export function AnswerDialog({ threadId, trigger }: AnswerDialogProps) {
  const t = useTranslations('threads');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  /** Toggle state: false = anonymous (default, "Off"), true = public ("On") */
  const [showIdentity, setShowIdentity] = useState(false);
  const [pending, start] = useTransition();

  const plainLen = htmlPlainLength(content);
  const isEmpty = plainLen === 0;
  const isTooLong = plainLen > MAX_CHARS;

  function reset() {
    setContent('');
    setShowIdentity(false);
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    setOpen(next);
  }

  function handleSubmit() {
    if (isEmpty) {
      toast({ title: t('validationEmpty'), variant: 'destructive' });
      return;
    }
    if (isTooLong) {
      toast({ title: t('validationTooLong'), variant: 'destructive' });
      return;
    }
    start(async () => {
      const res = await createAnswerAction({
        questionId: threadId,
        content,
        isAnonymous: !showIdentity, // toggle Off => anonymous
      });
      if (res.ok) {
        toast({ title: t('postSuccess') });
        setOpen(false);
        reset();
        router.refresh();
      } else {
        toast({ title: t('postError'), description: res.error, variant: 'destructive' });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger ?? <Button>{t('writeAnswer')}</Button>}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('answerDialogTitle')}</DialogTitle>
          <DialogDescription>
            {showIdentity ? t('publicHint') : t('anonymousHint')}
          </DialogDescription>
        </DialogHeader>

        <RichEditor value={content} onChange={setContent} placeholder={t('answerPlaceholder')} />

        <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-4 py-3">
          <div className="flex items-center gap-3">
            <Switch
              id="anonymous-toggle"
              checked={showIdentity}
              onCheckedChange={setShowIdentity}
              aria-describedby="anonymous-hint"
            />
            <div>
              <Label htmlFor="anonymous-toggle" className="cursor-pointer">
                {showIdentity ? (
                  <span className="inline-flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" /> Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <EyeOff className="h-3.5 w-3.5" /> {t('anonymousLabel')}
                  </span>
                )}
              </Label>
              <p id="anonymous-hint" className="text-xs text-muted-foreground">
                {showIdentity ? t('publicHint') : t('anonymousHint')}
              </p>
            </div>
          </div>
          <Badge variant={isTooLong ? 'warning' : 'muted'}>
            {t('charCount', { count: plainLen })}
          </Badge>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={pending}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={pending || isEmpty || isTooLong}>
            {tCommon('post')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
