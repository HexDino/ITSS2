'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, MessagesSquare, Users, Building2, Briefcase, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type SearchResult = {
  channels: Array<{ id: string; name: string; slug: string; category: string }>;
  mentors: Array<{ id: string; userId: string; position: string; company: string; user: { name: string } }>;
  companies: Array<{ id: string; name: string; slug: string; industry: string }>;
  jobs: Array<{ id: string; title: string; location: string | null; company: { name: string } }>;
};

const empty: SearchResult = { channels: [], mentors: [], companies: [], jobs: [] };

export function CommandPalette() {
  const t = useTranslations('search');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchResult>(empty);
  const [, start] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) {
      setResults(empty);
      return;
    }
    const ctrl = new AbortController();
    const id = setTimeout(() => {
      start(async () => {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, {
            signal: ctrl.signal,
          });
          if (res.ok) setResults(await res.json());
        } catch {
          /* aborted */
        }
      });
    }, 180);
    return () => {
      clearTimeout(id);
      ctrl.abort();
    };
  }, [q, open]);

  function go(href: string) {
    setOpen(false);
    setQ('');
    setResults(empty);
    router.push(href);
  }

  const hasAny =
    results.channels.length + results.mentors.length + results.companies.length + results.jobs.length > 0;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label={t('open')}
        className="hidden md:inline-flex h-9 gap-2 rounded-md border border-border bg-card/60 px-3 text-muted-foreground hover:text-foreground"
      >
        <Search className="h-4 w-4" />
        <span className="text-sm">{t('placeholder')}</span>
        <kbd className="ml-2 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground lg:inline">
          Ctrl K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label={t('open')}
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent hideCloseButton className="max-w-xl gap-0 overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-3">
            <DialogTitle className="sr-only">{t('title')}</DialogTitle>
            <div className="flex items-center gap-3">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('placeholder')}
                className="h-9 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto p-2">
            {q.trim().length < 2 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t('hint')}
              </p>
            ) : !hasAny ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                {t('empty')}
              </p>
            ) : (
              <div className="space-y-3">
                <ResultGroup
                  icon={<MessagesSquare className="h-3.5 w-3.5" />}
                  title={t('groups.channels')}
                  items={results.channels.map((c) => ({
                    key: c.id,
                    label: c.name,
                    sub: c.category,
                    onClick: () => go(`/channels/${c.slug}`),
                  }))}
                />
                <ResultGroup
                  icon={<Users className="h-3.5 w-3.5" />}
                  title={t('groups.mentors')}
                  items={results.mentors.map((m) => ({
                    key: m.id,
                    label: m.user.name,
                    sub: `${m.position} · ${m.company}`,
                    onClick: () => go(`/mentors/${m.userId}`),
                  }))}
                />
                <ResultGroup
                  icon={<Briefcase className="h-3.5 w-3.5" />}
                  title={t('groups.jobs')}
                  items={results.jobs.map((j) => ({
                    key: j.id,
                    label: j.title,
                    sub: [j.company.name, j.location].filter(Boolean).join(' · '),
                    onClick: () => go(`/jobs/${j.id}`),
                  }))}
                />
                <ResultGroup
                  icon={<Building2 className="h-3.5 w-3.5" />}
                  title={t('groups.companies')}
                  items={results.companies.map((c) => ({
                    key: c.id,
                    label: c.name,
                    sub: c.industry,
                    onClick: () => go(`/companies/${c.slug}`),
                  }))}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ResultGroup({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: Array<{ key: string; label: string; sub?: string; onClick: () => void }>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 px-2 pb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        {title}
      </div>
      <ul className="space-y-0.5">
        {items.map((it) => (
          <li key={it.key}>
            <button
              type="button"
              onClick={it.onClick}
              className="group flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{it.label}</div>
                {it.sub ? (
                  <div className="truncate text-xs text-muted-foreground">{it.sub}</div>
                ) : null}
              </div>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
