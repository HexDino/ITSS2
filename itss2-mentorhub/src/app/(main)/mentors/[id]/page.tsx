import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getEnhancedDb } from '@/lib/enhanced-db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { initials } from '@/lib/utils';
import { StartChatButton } from '@/components/chat/start-chat-button';

export const dynamic = 'force-dynamic';

export default async function MentorProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations('mentors');
  const db = await getEnhancedDb();

  const mentor = await db.mentorProfile.findFirst({
    where: { userId: id, verified: true },
    include: { user: { select: { id: true, name: true, image: true } } },
  });
  if (!mentor) notFound();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-center gap-4 space-y-0">
          <Avatar className="h-16 w-16">
            {mentor.user.image && <AvatarImage src={mentor.user.image} alt={mentor.user.name} />}
            <AvatarFallback className="text-lg">{initials(mentor.user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <CardTitle className="font-serif text-2xl">{mentor.user.name}</CardTitle>
            <p className="text-muted-foreground">
              {mentor.position} · {mentor.company}
            </p>
            <Badge variant="success">{t('verified')}</Badge>
          </div>
          {mentor.openToChat ? (
            <StartChatButton targetUserId={mentor.userId} label={t('chatNow')} />
          ) : (
            <Button variant="outline" disabled>
              {t('notOpen')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <Section title={t('experience', { years: mentor.yearsOfExperience })} />
          {mentor.bio && (
            <div>
              <h3 className="mb-1 text-sm font-medium">{t('bio')}</h3>
              <p className="whitespace-pre-line text-sm text-muted-foreground">{mentor.bio}</p>
            </div>
          )}
          <div>
            <h3 className="mb-2 text-sm font-medium">{t('expertise')}</h3>
            <div className="flex flex-wrap gap-1">
              {mentor.expertise.map((s) => (
                <Badge key={s} variant="outline">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return <p className="text-sm text-muted-foreground">{title}</p>;
}
