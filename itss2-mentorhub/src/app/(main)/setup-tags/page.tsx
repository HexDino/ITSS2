import { redirect } from 'next/navigation';
import { getActor } from '@/lib/actor';
import { SetupTagsForm } from './setup-tags-form';

export const dynamic = 'force-dynamic';

export default async function SetupTagsPage() {
  const actor = await getActor();
  if (!actor || actor.role !== 'STUDENT') {
    redirect('/channels');
  }

  return <SetupTagsForm />;
}
