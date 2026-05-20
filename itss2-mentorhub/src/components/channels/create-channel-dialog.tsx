'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { Plus } from 'lucide-react';
import { createChannelAction } from '@/app/(main)/channels/actions';

const CATEGORIES = [
  'FRONTEND',
  'BACKEND',
  'DEVOPS',
  'MOBILE',
  'DATA_AI',
  'PROCESS_GIT',
  'PROCESS_SCRUM',
  'CAREER',
  'OTHER',
] as const;

export function CreateChannelDialog() {
  const t = useTranslations('channels');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: 'OTHER' as (typeof CATEGORIES)[number],
    tags: '',
  });

  const reset = () => setForm({ name: '', description: '', category: 'OTHER', tags: '' });

  function submit() {
    start(async () => {
      const res = await createChannelAction(form);
      if (!res.ok) {
        toast({
          title: t('createError'),
          description: res.error,
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: res.approved ? t('createSuccess') : t('createPending'),
      });
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {t('proposeChannel')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('proposeChannel')}</DialogTitle>
          <DialogDescription>{t('proposeHint')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ch-name">{t('nameLabel')}</Label>
            <Input
              id="ch-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="GraphQL & Apollo"
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ch-desc">{t('descLabel')}</Label>
            <Textarea
              id="ch-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              maxLength={1000}
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t('categoryLabel')}</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm({ ...form, category: v as (typeof CATEGORIES)[number] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ch-tags">{t('tagsLabel')}</Label>
            <Input
              id="ch-tags"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="graphql, apollo, schema"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={submit} disabled={pending || form.name.length < 2}>
            {tCommon('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
