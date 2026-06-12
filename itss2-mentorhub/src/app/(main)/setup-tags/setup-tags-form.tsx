'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Layout, Server, Cloud, Briefcase, Check, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { saveTagsAction } from './actions';

const TAG_GROUPS = [
  {
    title: 'Frontend & Phát triển Web',
    icon: Layout,
    color: 'text-blue-500 bg-blue-500/10',
    tags: [
      { id: 'react', name: 'ReactJS' },
      { id: 'nextjs', name: 'Next.js' },
      { id: 'typescript', name: 'TypeScript' },
      { id: 'tailwindcss', name: 'Tailwind CSS' },
    ],
  },
  {
    title: 'Backend & Kiến trúc Hệ thống',
    icon: Server,
    color: 'text-indigo-500 bg-indigo-500/10',
    tags: [
      { id: 'nodejs', name: 'Node.js' },
      { id: 'postgresql', name: 'PostgreSQL' },
      { id: 'golang', name: 'Golang' },
      { id: 'system-design', name: 'System Design' },
    ],
  },
  {
    title: 'DevOps & Điện toán Đám mây',
    icon: Cloud,
    color: 'text-sky-500 bg-sky-500/10',
    tags: [
      { id: 'docker', name: 'Docker' },
      { id: 'kubernetes', name: 'Kubernetes' },
      { id: 'ci-cd', name: 'CI/CD Pipeline' },
      { id: 'aws', name: 'AWS Cloud' },
    ],
  },
  {
    title: 'Quy trình & Phát triển Nghề nghiệp',
    icon: Briefcase,
    color: 'text-emerald-500 bg-emerald-500/10',
    tags: [
      { id: 'scrum', name: 'Scrum & Agile' },
      { id: 'gitflow', name: 'Git & Workflow' },
      { id: 'cv', name: 'Viết CV & Resume' },
      { id: 'interview', name: 'Phỏng vấn / Career' },
    ],
  },
];

export function SetupTagsForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [isPending, startTransition] = React.useTransition();

  const handleToggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSave = () => {
    if (selectedTags.length === 0) {
      toast({
        title: 'Vui lòng chọn ít nhất 1 chủ đề',
        description: 'Điều này giúp chúng tôi cá nhân hóa kênh thảo luận tốt nhất cho bạn.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      try {
        const res = await saveTagsAction(selectedTags);
        if (res.ok) {
          toast({
            title: 'Thiết lập sở thích thành công!',
            description: 'Các kênh thảo luận của bạn đã được cá nhân hóa.',
          });
          router.push('/channels');
          router.refresh();
        } else {
          toast({
            title: 'Lỗi thiết lập',
            description: 'Không thể lưu sở thích của bạn. Vui lòng thử lại.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: 'Lỗi hệ thống',
          description: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex justify-center items-center py-6 md:py-12">
      <Card className="w-full max-w-4xl shadow-md border-border bg-card/70 backdrop-blur-sm">
        <CardHeader className="text-center space-y-2 pb-6 border-b border-border/60">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <CardTitle className="text-2xl font-serif md:text-3xl tracking-tight">
            Chào mừng bạn đến với Stubiz!
          </CardTitle>
          <CardDescription className="text-sm md:text-base max-w-lg mx-auto">
            Chọn các chủ đề công nghệ bạn quan tâm để cá nhân hóa và hiển thị các kênh thảo luận phù hợp nhất cho lộ trình học của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            {TAG_GROUPS.map((group) => {
              const Icon = group.icon;
              return (
                <div key={group.title} className="space-y-3 p-4 rounded-xl border border-border/50 bg-background/50">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${group.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold">{group.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {group.tags.map((tag) => {
                      const active = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => handleToggleTag(tag.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 outline-none ${
                            active
                              ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                              : 'bg-card text-muted-foreground border-border hover:border-muted-foreground/50 hover:text-foreground'
                          }`}
                        >
                          {active && <Check className="h-3 w-3 animate-scaleIn" />}
                          <span>{tag.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/60">
            <div className="text-xs text-muted-foreground">
              Đã chọn <strong className="text-foreground">{selectedTags.length}</strong> chủ đề quan tâm
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={() => router.push('/channels')}
                disabled={isPending}
                className="w-full sm:w-auto text-xs"
              >
                Bỏ qua thiết lập
              </Button>
              <Button
                onClick={handleSave}
                disabled={isPending}
                className="w-full sm:w-auto text-xs bg-primary hover:bg-primary/90"
              >
                {isPending ? 'Đang lưu...' : 'Hoàn tất & Khám phá'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
