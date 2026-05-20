'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
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

export function NotificationBell() {
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
    const id = setInterval(refresh, 30_000);
    return () => clearInterval(id);
  }, []);

  function toggle() {
    setOpen((v) => !v);
    if (!open && unread > 0) {
      start(async () => {
        await markAllReadAction();
        setUnread(0);
      });
    }
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" aria-label="Notifications" onClick={toggle}>
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
            <div className="border-b border-border px-3 py-2 text-sm font-semibold">
              Thông báo
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                  Chưa có thông báo
                </div>
              ) : (
                items.map((n) => (
                  <Link
                    key={n.id}
                    href={n.link ?? '#'}
                    onClick={() => setOpen(false)}
                    className="block border-b border-border/60 px-3 py-2 text-sm hover:bg-accent/60"
                  >
                    <div className="font-medium">{n.title}</div>
                    {n.body ? (
                      <div className="line-clamp-2 text-xs text-muted-foreground">
                        {n.body}
                      </div>
                    ) : null}
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
