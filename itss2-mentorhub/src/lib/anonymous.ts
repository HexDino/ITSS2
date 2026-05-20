/**
 * Strip identity from anonymous content before sending to clients.
 *
 * Acceptance criterion: when `isAnonymous = true`, no public consumer should
 * be able to see the real author. This helper sanitizes records server-side.
 */
export type WithAuthor<T> = T & {
  isAnonymous: boolean;
  author?: { id: string; name: string; image: string | null; role: string } | null;
  authorId?: string;
};

export function sanitizeAnonymous<T extends { isAnonymous: boolean; authorId?: string; author?: any }>(
  item: T,
  viewer?: { id?: string; role?: string },
): T {
  if (!item.isAnonymous) return item;
  const isOwner = viewer?.id && viewer.id === item.authorId;
  const isAdmin = viewer?.role === 'ADMIN';
  if (isOwner || isAdmin) return item;
  return {
    ...item,
    authorId: '__anonymous__',
    author: null,
  };
}

export function sanitizeAnonymousList<T extends { isAnonymous: boolean; authorId?: string; author?: any }>(
  items: T[],
  viewer?: { id?: string; role?: string },
): T[] {
  return items.map((i) => sanitizeAnonymous(i, viewer));
}
