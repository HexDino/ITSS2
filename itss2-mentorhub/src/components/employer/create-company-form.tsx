'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/toast';
import { createCompanyAction } from '@/app/(main)/employer/actions';

const SIZES = ['STARTUP', 'SMALL', 'MEDIUM', 'LARGE'] as const;

export function CreateCompanyForm() {
  const t = useTranslations('employer');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    name: '',
    website: '',
    industry: '',
    location: '',
    size: 'SMALL',
    description: '',
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await createCompanyAction(form);
      if (!res.ok) {
        toast({ title: t('companyCreateFailed'), description: res.error, variant: 'destructive' });
        return;
      }
      toast({ title: t('companyCreated') });
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <p className="text-sm text-muted-foreground">{t('createCompanyHint')}</p>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="cc-name">{t('companyName')} *</Label>
          <Input
            id="cc-name"
            required
            minLength={2}
            maxLength={200}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cc-website">{t('companyWebsite')}</Label>
          <Input
            id="cc-website"
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cc-industry">{t('companyIndustry')}</Label>
          <Input
            id="cc-industry"
            value={form.industry}
            onChange={(e) => setForm({ ...form, industry: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cc-location">{t('companyLocation')}</Label>
          <Input
            id="cc-location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="cc-size">{t('companySize')}</Label>
          <select
            id="cc-size"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2 space-y-1">
          <Label htmlFor="cc-desc">{t('companyDescription')}</Label>
          <Textarea
            id="cc-desc"
            rows={4}
            maxLength={5000}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? tCommon('loading') : t('createCompany')}
        </Button>
      </div>
    </form>
  );
}
