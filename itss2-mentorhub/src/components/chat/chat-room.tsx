'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { sendMessageAction } from '@/app/(main)/chat/actions';
import { useRouter } from 'next/navigation';

interface ClientMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

export function ChatRoomClient({
  roomId,
  currentUserId,
  initialMessages,
  placeholder,
}: {
  roomId: string;
  currentUserId: string;
  initialMessages: ClientMessage[];
  placeholder: string;
}) {
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [text, setText] = useState('');
  const [pending, start] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [initialMessages.length]);

  // Lightweight polling for new messages (MVP — replace with SSE/socket later).
  // Skip when the tab is hidden so we don't spam the server.
  useEffect(() => {
    const tick = () => {
      if (typeof document === 'undefined' || !document.hidden) router.refresh();
    };
    const id = setInterval(tick, 3000);
    return () => clearInterval(id);
  }, [router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setText('');
    start(async () => {
      await sendMessageAction({ roomId, content });
      router.refresh();
    });
  }

  return (
    <>
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {initialMessages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                  mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} maxLength={5000} />
        <Button type="submit" disabled={pending || !text.trim()}>
          {tCommon('send')}
        </Button>
      </form>
    </>
  );
}
