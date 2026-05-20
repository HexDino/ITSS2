'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { startChatAction } from '@/app/(main)/chat/actions';

export function StartChatButton({ targetUserId, label }: { targetUserId: string; label: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      onClick={() =>
        start(() => {
          void startChatAction(targetUserId);
        })
      }
      disabled={pending}
    >
      {label}
    </Button>
  );
}
