'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  listNotificationsAction,
  markAllReadAction,
} from '@/app/(main)/notifications-actions';

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: Date | string;
};

function relativeTime(value: Date | string, locale: string) {
  const d = typeof value === 'string' ? new Date(value) : value;
  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (abs < 60) return rtf.format(diffSec, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(diffSec / 86400), 'day');
  return d.toLocaleDateString(locale);
}

export function NotificationBell() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [, start] = useTransition();

  async function refresh() {
    const res = await listNotificationsAction(10);
    setItems(res.items as unknown as Notif[]);
    setUnread(res.unread);
  }

  useEffect(() => {
    void refresh();
    const id = setInterval(() => {
      if (typeof document === 'undefined' || !document.hidden) void refresh();
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  function toggle() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      start(async () => {
        await markAllReadAction();
        setUnread(0);
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      });
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label={t('aria')} onClick={toggle}>
        <Bell className="h-4 w-4" />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {unread > 9 ? '9+' : unread}
          </span>
        ) : null}
      </Button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 rounded-md border border-border bg-card shadow-lg">
            <div className="border-b border-border px-3 py-2 text-sm font-semibold">{t('title')}</div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">{t('empty')}</div>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? '#'}
                    onClick={() => setOpen(false)}
                    className={`block border-b border-border/60 px-3 py-2 text-sm hover:bg-accent/60 ${
                      n.read ? '' : 'bg-primary/5'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && (
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-none rounded-full bg-primary" aria-hidden />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{n.title}</div>
                        {n.body ? (
                          <div className="line-clamp-2 text-xs text-muted-foreground">{n.body}</div>
                        ) : null}
                        <div className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {relativeTime(n.createdAt, locale)}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
