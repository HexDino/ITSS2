import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function MentorsPage() {
  const t = await getTranslations('mentors');
  const db = await getEnhancedDb();

  // Only verified mentors visible per acceptance criteria
  const mentors = await db.mentorProfile.findMany({
    where: { verified: true },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { yearsOfExperience: 'desc' },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-serif text-3xl tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mentors.map((m) => (
          <Link key={m.id} href={`/mentors/${m.userId}`}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardHeader className="flex-row gap-3 space-y-0">
                <Avatar className="h-12 w-12">
                  {m.user.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
                  <AvatarFallback>{initials(m.user.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">{m.user.name}</CardTitle>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.position} · {m.company}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('experience', { years: m.yearsOfExperience })}</p>
                <div className="flex flex-wrap gap-1">
                  {m.expertise.slice(0, 4).map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
                <Badge variant="success">{t('verified')}</Badge>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
