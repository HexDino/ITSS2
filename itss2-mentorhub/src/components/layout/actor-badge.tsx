import { cookies } from 'next/headers';
import { getActor } from '@/lib/actor';
import { pickAnimal } from '@/lib/anonymous-animal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { initials } from '@/lib/utils';

const VISITOR_COOKIE = 'mh_visitor';

/**
 * Top-right corner badge that identifies the current actor:
 * - logged-in user → real avatar + name
 * - guest (cookie-backed, with or without a DB row yet) → deterministic
 *   anonymous animal (emoji + Vietnamese name, à la Google Docs). The seed
 *   comes from `mh_visitor` (set by middleware on first visit) so the badge
 *   appears immediately, even before any server action has been performed.
 */
export async function ActorBadge() {
  const actor = await getActor();

  if (actor && !actor.isGuest) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 py-1 pl-1 pr-3">
        <Avatar className="h-7 w-7">
          {actor.image && <AvatarImage src={actor.image} alt={actor.name} />}
          <AvatarFallback className="text-[10px]">{initials(actor.name)}</AvatarFallback>
        </Avatar>
        <span className="hidden text-xs font-medium leading-none sm:inline">{actor.name}</span>
      </div>
    );
  }

  // Guest path — prefer visitor cookie so the avatar stays the same regardless
  // of whether the guest's DB row has been created yet.
  const jar = await cookies();
  const seed = jar.get(VISITOR_COOKIE)?.value ?? actor?.id ?? 'anonymous';
  const animal = pickAnimal(seed);
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-border/70 bg-card/60 py-1 pl-1 pr-3"
      title={`Bạn đang xem ẩn danh dưới danh tính ${animal.name}`}
    >
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-full text-base shadow-inner"
        style={{
          backgroundColor: `hsl(${animal.hue} 70% 90%)`,
          color: `hsl(${animal.hue} 80% 25%)`,
        }}
      >
        {animal.emoji}
      </span>
      <span className="hidden text-xs font-medium leading-none sm:inline">
        {animal.name}
        <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          ẩn danh
        </span>
      </span>
    </div>
  );
}
