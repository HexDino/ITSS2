import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  MessagesSquare,
  Users,
  Briefcase,
  Building2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const t = await getTranslations('home');
  const tNav = await getTranslations('nav');
  const tChannels = await getTranslations('channels');
  const session = await auth();
  const db = await getEnhancedDb();

  const [channelCount, mentorCount, jobCount, companyCount, hotChannels, latestJobs, topMentors] =
    await Promise.all([
      db.channel.count(),
      db.mentorProfile.count({ where: { verified: true } }),
      db.job.count({ where: { status: 'OPEN' } }),
      db.company.count(),
      db.channel.findMany({
        include: { _count: { select: { threads: true } } },
        orderBy: [{ threads: { _count: 'desc' } }, { createdAt: 'desc' }],
        take: 4,
      }),
      db.job.findMany({
        where: { status: 'OPEN' },
        include: { company: { select: { name: true, logo: true } } },
        orderBy: { createdAt: 'desc' },
        take: 4,
      }),
      db.mentorProfile.findMany({
        where: { verified: true },
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { yearsOfExperience: 'desc' },
        take: 4,
      }),
    ]);

  const stats: Array<{ label: string; value: number; href: string; icon: React.ReactNode }> = [
    { label: tNav('channels'), value: channelCount, href: '/channels', icon: <MessagesSquare className="h-5 w-5" /> },
    { label: tNav('mentors'), value: mentorCount, href: '/mentors', icon: <Users className="h-5 w-5" /> },
    { label: tNav('jobs'), value: jobCount, href: '/jobs', icon: <Briefcase className="h-5 w-5" /> },
    { label: tNav('companies'), value: companyCount, href: '/companies', icon: <Building2 className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card px-6 py-7 md:px-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {t('badge')}
            </div>
            <h1 className="font-serif text-2xl tracking-tight md:text-3xl">
              {session?.user?.name ? t('greeting', { name: session.user.name }) : t('title')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link href="/channels">{t('cta.askQuestion')}</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/jobs">{t('cta.findJob')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group">
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.label}</p>
                  <p className="mt-0.5 text-2xl font-semibold leading-tight">{s.value}</p>
                </div>
                <div className="rounded-md bg-primary/10 p-2 text-primary">{s.icon}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>

      {/* Main grid: left = channels + jobs, right = mentors */}
      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8 xl:gap-10">
        <div className="space-y-6 lg:col-span-3">
          <section className="space-y-3">
            <SectionHeader title={t('sections.hotChannels')} href="/channels" />
            <div className="grid gap-3 sm:grid-cols-2">
              {hotChannels.map((c) => (
                <Link key={c.id} href={`/channels/${c.slug}`} className="group">
                  <Card className="h-full transition-colors hover:border-primary/40">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-sm group-hover:text-primary">{c.name}</CardTitle>
                        <Badge variant="muted" className="text-[10px]">
                          {tChannels(`categories.${c.category}` as any)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="flex items-center gap-1.5 pt-0 text-xs text-muted-foreground">
                      <MessagesSquare className="h-3 w-3" />
                      <span className="font-medium text-foreground">{c._count.threads}</span> {tChannels('threads')}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader title={t('sections.latestJobs')} href="/jobs" />
            <div className="space-y-2">
              {latestJobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`} className="group">
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium group-hover:text-primary">{j.title}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {j.company.name}
                          {j.location ? ` · ${j.location}` : ''}
                        </div>
                      </div>
                      <Badge variant="muted" className="shrink-0 text-[10px]">
                        {j.type}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-3 lg:col-span-2">
          <SectionHeader title={t('sections.topMentors')} href="/mentors" />
          <div className="space-y-2">
            {topMentors.map((m) => (
              <Link key={m.id} href={`/mentors/${m.userId}`}>
                <Card className="transition-colors hover:border-primary/40">
                  <CardContent className="flex items-center gap-3 py-3">
                    <Avatar className="h-9 w-9">
                      {m.user.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
                      <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{m.user.name}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {m.position} · {m.yearsOfExperience}+ y
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="font-serif text-lg tracking-tight">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Xem tất cả
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
