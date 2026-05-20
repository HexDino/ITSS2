'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import type { StudentProfile } from '@prisma/client';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { updateStudentProfileAction } from '@/app/(main)/profile/actions';
import { Upload, FileText } from 'lucide-react';

export function StudentProfileForm({ profile }: { profile: StudentProfile | null }) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [cvUrl, setCvUrl] = useState(profile?.cvUrl ?? null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    bio: profile?.bio ?? '',
    university: profile?.university ?? '',
    major: profile?.major ?? '',
    yearOfStudy: profile?.yearOfStudy ?? '',
    skills: (profile?.skills ?? []).join(', '),
    github: profile?.github ?? '',
    linkedin: profile?.linkedin ?? '',
    portfolio: profile?.portfolio ?? '',
  });

  async function onCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({ title: 'PDF only', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload/cv', { method: 'POST', body: fd });
      const data = (await res.json()) as { ok?: boolean; url?: string; error?: string };
      if (data.ok && data.url) {
        setCvUrl(data.url);
        toast({ title: 'OK' });
      } else {
        toast({ title: data.error ?? 'ERROR', variant: 'destructive' });
      }
    } finally {
      setUploading(false);
    }
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await updateStudentProfileAction(form);
      toast({
        title: res.ok ? tCommon('save') : res.error,
        variant: res.ok ? undefined : 'destructive',
      });
    });
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <Field label={t('bio')}>
        <Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={t('university')}>
          <Input value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
        </Field>
        <Field label={t('major')}>
          <Input value={form.major} onChange={(e) => setForm({ ...form, major: e.target.value })} />
        </Field>
        <Field label={t('year')}>
          <Input
            type="number"
            min={1}
            max={8}
            value={form.yearOfStudy}
            onChange={(e) => setForm({ ...form, yearOfStudy: e.target.value })}
          />
        </Field>
        <Field label="Portfolio URL">
          <Input value={form.portfolio} onChange={(e) => setForm({ ...form, portfolio: e.target.value })} />
        </Field>
        <Field label="GitHub">
          <Input value={form.github} onChange={(e) => setForm({ ...form, github: e.target.value })} />
        </Field>
        <Field label="LinkedIn">
          <Input value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
        </Field>
      </div>
      <Field label={t('skills')}>
        <Input
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          placeholder="react, typescript, postgresql"
        />
      </Field>

      <div className="space-y-2">
        <Label>{t('uploadCV')}</Label>
        <div className="flex items-center gap-3">
          <input ref={fileInput} type="file" accept="application/pdf" onChange={onCvChange} className="hidden" />
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
            <Upload className="mr-2 h-4 w-4" /> {uploading ? '...' : t('uploadCV')}
          </Button>
          {cvUrl && (
            <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
              <FileText className="h-3.5 w-3.5" /> CV
            </a>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {form.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => (
            <Badge key={s} variant="outline">
              {s}
            </Badge>
          ))}
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
