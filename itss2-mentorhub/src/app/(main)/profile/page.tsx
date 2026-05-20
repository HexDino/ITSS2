import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentProfileForm } from '@/components/profile/student-profile-form';
import { MentorProfileForm } from '@/components/profile/mentor-profile-form';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const t = await getTranslations('profile');
  const session = await auth();
  if (!session?.user) redirect('/login');

  if (session.user.role === 'STUDENT') {
    const profile = await prisma.studentProfile.findUnique({ where: { userId: session.user.id } });
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentProfileForm profile={profile} />
        </CardContent>
      </Card>
    );
  }

  if (session.user.role === 'MENTOR') {
    const profile = await prisma.mentorProfile.findUnique({ where: { userId: session.user.id } });
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-2xl">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <MentorProfileForm profile={profile} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-2xl">{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Role: {session.user.role}</p>
      </CardContent>
    </Card>
  );
}
