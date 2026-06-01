/**
 * Unified "current actor" abstraction that prefers a real NextAuth session
 * and falls back to a cookie-backed anonymous guest user.
 *
 * Use `getActor()` in read paths (returns `null` if there is neither session
 * nor guest cookie — caller decides whether to render an empty state).
 *
 * Use `getOrCreateActor()` in write paths that should auto-promote an
 * anonymous visitor into a guest user (e.g. starting a chat or sending a
 * message). This sets the guest cookie as a side effect.
 */
import { auth } from './auth';
import { getGuestUser, getOrCreateGuestUser, isGuestEmail } from './guest';
import type { Role } from '@prisma/client';

export interface Actor {
  id: string;
  role: Role;
  name: string;
  image: string | null;
  email: string;
  isGuest: boolean;
}

export async function getActor(): Promise<Actor | null> {
  const session = await auth();
  if (session?.user) {
    return {
      id: session.user.id,
      role: session.user.role,
      name: session.user.name ?? 'User',
      image: session.user.image ?? null,
      email: session.user.email ?? '',
      isGuest: false,
    };
  }
  const g = await getGuestUser();
  if (!g) return null;
  return {
    id: g.id,
    role: g.role,
    name: g.name,
    image: g.image,
    email: g.email,
    isGuest: isGuestEmail(g.email),
  };
}

export async function getOrCreateActor(): Promise<Actor> {
  const existing = await getActor();
  if (existing) return existing;
  const g = await getOrCreateGuestUser();
  return {
    id: g.id,
    role: g.role,
    name: g.name,
    image: g.image,
    email: g.email,
    isGuest: true,
  };
}
