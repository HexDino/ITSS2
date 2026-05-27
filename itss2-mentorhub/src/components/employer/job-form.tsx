'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { createJobAction } from '@/app/(main)/employer/actions';

const JOB_TYPES = ['INTERNSHIP', 'JUNIOR', 'PARTTIME', 'FULLTIME'] as const;
const JOB_STATUS = ['OPEN', 'DRAFT', 'CLOSED'] as const;

export function JobForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({
    title: '',
    type: 'INTERNSHIP' as (typeof JOB_TYPES)[number],
    status: 'OPEN' as (typeof JOB_STATUS)[number],
    location: '',
    salaryRange: '',
    tags: '',
    deadline: '',
    description: '',
    requirements: '',
    benefits: '',
  });

  function submit() {
    start(async () => {
      const r = await createJobAction(form);
      if (!r.ok) {
        const desc =
          r.error === 'INVALID_DEADLINE'
            ? 'Hạn nộp không hợp lệ (đã qua hoặc sai định dạng).'
            : r.error;
        toast({ title: 'Lỗi đăng tin', description: desc, variant: 'destructive' });
        return;
      }
      toast({ title: 'Đã đăng tin tuyển dụng' });
      router.refresh();
      router.push(`/jobs/${r.jobId}`);
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="j-title">Tiêu đề</Label>
        <Input
          id="j-title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Frontend Developer Intern"
          maxLength={200}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Loại hình</Label>
        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as (typeof JOB_TYPES)[number] })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JOB_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Trạng thái</Label>
        <Select
          value={form.status}
          onValueChange={(v) => setForm({ ...form, status: v as (typeof JOB_STATUS)[number] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {JOB_STATUS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="j-loc">Địa điểm</Label>
        <Input id="j-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="j-salary">Mức lương</Label>
        <Input
          id="j-salary"
          value={form.salaryRange}
          onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
          placeholder="5-8 triệu VND"
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="j-tags">Thẻ (cách nhau bằng dấu phẩy)</Label>
        <Input
          id="j-tags"
          value={form.tags}
          onChange={(e) => setForm({ ...form, tags: e.target.value })}
          placeholder="react, typescript"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="j-deadline">Hạn nộp</Label>
        <Input
          id="j-deadline"
          type="date"
          value={form.deadline}
          onChange={(e) => setForm({ ...form, deadline: e.target.value })}
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="j-desc">Mô tả công việc</Label>
        <Textarea
          id="j-desc"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={6}
          maxLength={20000}
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="j-req">Yêu cầu</Label>
        <Textarea
          id="j-req"
          value={form.requirements}
          onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          rows={4}
          maxLength={10000}
        />
      </div>
      <div className="space-y-1.5 md:col-span-2">
        <Label htmlFor="j-ben">Quyền lợi</Label>
        <Textarea
          id="j-ben"
          value={form.benefits}
          onChange={(e) => setForm({ ...form, benefits: e.target.value })}
          rows={3}
          maxLength={5000}
        />
      </div>
      <div className="md:col-span-2">
        <Button onClick={submit} disabled={pending || form.title.length < 3 || form.description.length < 10}>
          Đăng tin
        </Button>
      </div>
    </div>
  );
}
