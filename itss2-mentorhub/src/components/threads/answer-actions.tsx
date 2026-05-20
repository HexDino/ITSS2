'use client';

import { useState, useTransition } from 'react';
import { ThumbsUp, Check, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { acceptAnswerAction, toggleVoteAction } from '@/app/(main)/threads/actions';

export function AnswerActions({
  answerId,
  upvotes,
  accepted,
  voted: votedInit = false,
  canAccept,
  onReport,
}: {
  answerId: string;
  upvotes: number;
  accepted: boolean;
  voted?: boolean;
  canAccept: boolean;
  onReport: () => void;
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  const [count, setCount] = useState(upvotes);
  const [voted, setVoted] = useState(votedInit);

  return (
    <div className="flex items-center gap-2 pt-2">
      <Button
        size="sm"
        variant={voted ? 'default' : 'ghost'}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const r = await toggleVoteAction(answerId);
            if (!r.ok) {
              toast({ title: 'Lỗi', description: r.error, variant: 'destructive' });
              return;
            }
            setCount(r.upvotes);
            setVoted(!!r.voted);
          })
        }
      >
        <ThumbsUp className="mr-1 h-4 w-4" />
        {count}
      </Button>
      {canAccept && (
        <Button
          size="sm"
          variant={accepted ? 'default' : 'outline'}
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await acceptAnswerAction(answerId);
              if (!r.ok) toast({ title: 'Lỗi', description: r.error, variant: 'destructive' });
            })
          }
        >
          <Check className="mr-1 h-4 w-4" />
          {accepted ? 'Đã chấp nhận' : 'Đánh dấu giải pháp'}
        </Button>
      )}
      <Button size="sm" variant="ghost" onClick={onReport}>
        <Flag className="mr-1 h-4 w-4" />
        Báo cáo
      </Button>
    </div>
  );
}
