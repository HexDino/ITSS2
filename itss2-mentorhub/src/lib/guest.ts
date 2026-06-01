/**
 * Cookie-based anonymous guest identity.
 *
 * - On first visit (no NextAuth session, no valid guest cookie) we create a
 *   real `User` row with role STUDENT and a marker email `guest-<id>@guest.local`,
 *   then set an httpOnly cookie containing `<userId>.<HMAC>` so we can recognize
 *   the same visitor on subsequent requests without storing any PII.
 * - The cookie is signed with `AUTH_SECRET` (same secret as NextAuth) so
 *   tampered cookies are rejected.
 * - Guests are intentionally indistinguishable from real users at the DB layer
 *   so ZenStack policies and the chat code path keep working without forking.
 */
import { cookies } from 'next/headers';
import crypto from 'node:crypto';
import { prisma } from './db';
import type { User } from '@prisma/client';

export const GUEST_COOKIE = 'mh_guest';
export const GUEST_EMAIL_DOMAIN = 'guest.local';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function getSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is missing or too short (>= 16 chars required).');
  }
  return s;
}

function sign(value: string): string {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function pack(userId: string): string {
  return `${userId}.${sign(userId)}`;
}

function unpack(raw: string | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(id);
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return id;
}

export function isGuestEmail(email: string | null | undefined): boolean {
  return !!email && email.endsWith(`@${GUEST_EMAIL_DOMAIN}`);
}

function shortLabel(id: string): string {
  // Last 4 chars of the cuid → short readable suffix, e.g. "Guest #A1B2".
  return id.slice(-4).toUpperCase();
}

/**
 * Read the guest cookie and return the matching User row, or null if there is
 * no cookie / signature mismatch / user no longer exists.
 */
export async function getGuestUser(): Promise<User | null> {
  const jar = await cookies();
  const raw = jar.get(GUEST_COOKIE)?.value;
  const id = unpack(raw);
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || !isGuestEmail(user.email)) return null;
  return user;
}

/**
 * Get the existing guest or create a new one, setting the cookie on the
 * outgoing response. Safe to call from server actions and route handlers
 * (any place where `cookies()` is mutable).
 */
export async function getOrCreateGuestUser(): Promise<User> {
  const existing = await getGuestUser();
  if (existing) return existing;

  // Create user with role STUDENT — chat policies treat guests the same as
  // students; downstream features (jobs, channels) gate by `isGuestEmail()`.
  const seed = crypto.randomBytes(6).toString('hex');
  const email = `guest-${seed}@${GUEST_EMAIL_DOMAIN}`;
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Guest',
      role: 'STUDENT',
    },
  });
  // Update name with stable label derived from the cuid suffix.
  const named = await prisma.user.update({
    where: { id: user.id },
    data: { name: `Guest #${shortLabel(user.id)}` },
  });

  const jar = await cookies();
  jar.set({
    name: GUEST_COOKIE,
    value: pack(named.id),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return named;
}

export async function clearGuestCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(GUEST_COOKIE);
}
