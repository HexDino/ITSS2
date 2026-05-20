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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RichEditor } from '@/components/editor/rich-editor';
import { useToast } from '@/components/ui/toast';
import { createThreadAction } from '@/app/(main)/channels/actions';

export function NewThreadDialog({
  channelId,
  channelSlug,
  trigger,
}: {
  channelId: string;
  channelSlug: string;
  trigger?: React.ReactNode;
}) {
  const t = useTranslations('threads');
  const tChan = useTranslations('channels');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ title: '', content: '', tags: '', anon: false });

  function submit() {
    start(async () => {
      const res = await createThreadAction({
        channelId,
        channelSlug,
        title: form.title,
        content: form.content,
        tags: form.tags,
        isAnonymous: form.anon,
      });
      // redirect inside action; if it returns -> error
      if (res && !res.ok) toast({ title: res.error, variant: 'destructive' });
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button>{tChan('createThread')}</Button>}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t('newTitle')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('titleLabel')}</Label>
            <Input
              value={form.title}
              maxLength={300}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder={t('titlePlaceholder')}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('contentLabel')}</Label>
            <RichEditor value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder={t('contentPlaceholder')} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('tagsLabel')}</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="react, nextjs, prisma" />
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Switch checked={form.anon} onCheckedChange={(v) => setForm({ ...form, anon: v })} id="thread-anon" />
            <Label htmlFor="thread-anon" className="cursor-pointer text-sm">
              {t('anonymousLabel')}
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending || form.title.length < 5}>
            {tCommon('post')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
