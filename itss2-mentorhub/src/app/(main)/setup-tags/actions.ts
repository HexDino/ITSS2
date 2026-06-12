'use server';

import { prisma } from '@/lib/db';
import { getActor } from '@/lib/actor';

export async function saveTagsAction(tags: string[]) {
  const actor = await getActor();
  if (!actor || actor.role !== 'STUDENT') {
    return { ok: false, error: 'Unauthorized' };
  }

  // Update skills in StudentProfile
  await prisma.studentProfile.update({
    where: { userId: actor.id },
    data: {
      skills: tags,
    },
  });

  return { ok: true };
}
