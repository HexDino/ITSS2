import { redirect } from 'next/navigation';
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

export default async function AdminPage() {
  const t = await getTranslations('admin');
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'ADMIN') redirect('/channels');

  const [mentors, channels, reports] = await Promise.all([
    prisma.mentorProfile.findMany({
      where: { verified: false },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.channel.findMany({ where: { approved: false }, orderBy: { createdAt: 'desc' } }),
    prisma.report.findMany({
      where: { status: 'PENDING' },
      include: { reporter: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
      <Tabs defaultValue="mentors">
        <TabsList>
          <TabsTrigger value="mentors">
            {t('pendingMentors')} <Badge variant="muted" className="ml-2">{mentors.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="channels">
            {t('pendingChannels')} <Badge variant="muted" className="ml-2">{channels.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="reports">
            {t('reports')} <Badge variant="muted" className="ml-2">{reports.length}</Badge>
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
    </div>
  );
}
