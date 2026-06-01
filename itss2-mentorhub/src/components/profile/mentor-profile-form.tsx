'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { MentorProfile } from '@prisma/client';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TagInput } from '@/components/ui/tag-input';
import { useToast } from '@/components/ui/toast';
import { updateMentorProfileAction } from '@/app/(main)/profile/actions';

export function MentorProfileForm({ profile }: { profile: MentorProfile | null }) {
  const t = useTranslations('mentors');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    company: profile?.company ?? '',
    position: profile?.position ?? '',
    yearsOfExperience: profile?.yearsOfExperience ?? 0,
    bio: profile?.bio ?? '',
    expertise: profile?.expertise ?? [],
    openToChat: profile?.openToChat ?? true,
  });

  function save(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateMentorProfileAction({ ...form, expertise: form.expertise.join(', ') });
      toast({
        title: res.ok ? tCommon('save') : res.error,
        variant: res.ok ? undefined : 'destructive',
      });
    });
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('company')}>
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </Field>
        <Field label={t('position')}>
          <Input value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
        </Field>
        <Field label={t('experience', { years: form.yearsOfExperience })}>
          <Input
            type="number"
            min={0}
            max={60}
            value={form.yearsOfExperience}
            onChange={(e) => setForm({ ...form, yearsOfExperience: Number(e.target.value) })}
          />
        </Field>
      </div>
      <Field label={t('expertise')}>
        <TagInput
          value={form.expertise}
          onChange={(expertise) => setForm({ ...form, expertise })}
          placeholder="kubernetes, golang, sre"
        />
      </Field>
      <Field label={t('bio')}>
        <Textarea rows={4} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </Field>
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/30 px-3 py-2">
        <Switch
          id="openToChat"
          checked={form.openToChat}
          onCheckedChange={(v) => setForm({ ...form, openToChat: v })}
        />
        <Label htmlFor="openToChat" className="cursor-pointer">
          Open to chat
        </Label>
      </div>
      <Button type="submit" disabled={pending}>
        {tCommon('save')}
      </Button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
