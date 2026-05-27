import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminMentorRow } from '@/components/admin/mentor-row';
import { AdminChannelRow } from '@/components/admin/channel-row';
import { AdminReportRow } from '@/components/admin/report-row';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 15;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const t = await getTranslations('admin');
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/channels');

  const sp = await searchParams;
  const tab = sp.tab === 'channels' || sp.tab === 'reports' ? sp.tab : 'mentors';
  const page = Math.max(1, Number(sp.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [mentorCount, channelCount, reportCount] = await Promise.all([
    prisma.mentorProfile.count({ where: { verified: false } }),
    prisma.channel.count({ where: { approved: false } }),
    prisma.report.count({ where: { status: 'PENDING' } }),
  ]);

  const mentors =
    tab === 'mentors'
      ? await prisma.mentorProfile.findMany({
          where: { verified: false },
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: PAGE_SIZE,
        })
      : [];
  const channels =
    tab === 'channels'
      ? await prisma.channel.findMany({
          where: { approved: false },
          orderBy: { createdAt: 'desc' },
          skip,
          take: PAGE_SIZE,
        })
      : [];
  const reports =
    tab === 'reports'
      ? await prisma.report.findMany({
          where: { status: 'PENDING' },
          include: { reporter: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          skip,
          take: PAGE_SIZE,
        })
      : [];

  const totalForTab = tab === 'mentors' ? mentorCount : tab === 'channels' ? channelCount : reportCount;
  const totalPages = Math.max(1, Math.ceil(totalForTab / PAGE_SIZE));

  const pageLink = (p: number) => `/admin?tab=${tab}&page=${p}`;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
      <Tabs value={tab}>
        <TabsList>
          <TabsTrigger value="mentors" asChild>
            <Link href="/admin?tab=mentors">
              {t('pendingMentors')} <Badge variant="muted" className="ml-2">{mentorCount}</Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="channels" asChild>
            <Link href="/admin?tab=channels">
              {t('pendingChannels')} <Badge variant="muted" className="ml-2">{channelCount}</Badge>
            </Link>
          </TabsTrigger>
          <TabsTrigger value="reports" asChild>
            <Link href="/admin?tab=reports">
              {t('reports')} <Badge variant="muted" className="ml-2">{reportCount}</Badge>
            </Link>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentors" className="space-y-3">
          {mentors.map((m) => (
            <Card key={m.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{m.user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.position} · {m.company} · {m.user.email}
                  </p>
                </div>
                <AdminMentorRow mentorId={m.id} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="channels" className="space-y-3">
          {channels.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.category}</p>
                </div>
                <AdminChannelRow channelId={c.id} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="reports" className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id}>
              <CardContent className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">
                    {r.targetType} #{r.targetId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {r.reason} — by {r.reporter.name}
                  </p>
                </div>
                <AdminReportRow reportId={r.id} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-2 pt-2 text-sm">
          {page > 1 ? (
            <Link href={pageLink(page - 1)} className="rounded-md border border-border px-3 py-1 hover:bg-accent">
              ←
            </Link>
          ) : null}
          <span className="text-muted-foreground">{page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={pageLink(page + 1)} className="rounded-md border border-border px-3 py-1 hover:bg-accent">
              →
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
