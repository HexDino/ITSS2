'use client';

import { useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { updateApplicationStatusAction } from '@/app/(main)/employer/actions';

const STATUSES = ['RECEIVED', 'REVIEWING', 'INTERVIEW', 'ACCEPTED', 'REJECTED'] as const;

export function ApplicationStatusControl({
  applicationId,
  status,
}: {
  applicationId: string;
  status: (typeof STATUSES)[number];
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
            await updateApplicationStatusAction(applicationId, v as (typeof STATUSES)[number]);
            toast({ title: 'Đã cập nhật' });
          } catch (e) {
            toast({ title: 'Lỗi', description: (e as Error).message, variant: 'destructive' });
          }
        })
      }
    >
      <SelectTrigger className="w-36">
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
