'use client';

import { useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateJobStatusAction } from '@/app/(main)/employer/actions';

const STATUSES = ['OPEN', 'DRAFT', 'CLOSED'] as const;

export function JobStatusControl({
  jobId,
  status,
}: {
  jobId: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
}) {
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <Select
      value={status}
      disabled={pending}
      onValueChange={(v) =>
        start(async () => {
          try {
            await updateJobStatusAction(jobId, v as (typeof STATUSES)[number]);
            toast({ title: 'Đã cập nhật trạng thái' });
          } catch (e) {
            toast({ title: 'Lỗi', description: (e as Error).message, variant: 'destructive' });
          }
        })
      }
    >
      <SelectTrigger className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
