import { cookies } from 'next/headers';
import Link from 'next/link';
import { getActor } from '@/lib/actor';
import { pickAnimal } from '@/lib/anonymous-animal';
import { ActorDropdown } from './actor-dropdown';
import { Button } from '@/components/ui/button';

const VISITOR_COOKIE = 'mh_visitor';

/**
 * Top-right corner badge that identifies the current actor,
 * now using an interactive client dropdown for role switching and sign out,
 * alongside login/register buttons for guest users.
 */
export async function ActorBadge() {
  const actor = await getActor();
  const jar = await cookies();
  const seed = jar.get(VISITOR_COOKIE)?.value ?? actor?.id ?? 'anonymous';
  const animal = pickAnimal(seed);

  return (
    <div className="flex items-center gap-2">
      {(!actor || actor.isGuest) && (
        <div className="flex items-center gap-1.5 mr-1">
          <Button variant="ghost" size="sm" asChild className="text-xs h-8">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button size="sm" asChild className="text-xs h-8">
            <Link href="/register">Đăng ký</Link>
          </Button>
        </div>
      )}
      <ActorDropdown actor={actor} animal={animal} />
    </div>
  );
}

