import { enhance } from '@zenstackhq/runtime';
import { prisma } from './db';
import { auth } from './auth';
import type { PrismaClient } from '@prisma/client';

/**
 * Returns a Prisma client enhanced with ZenStack access policies bound to the
 * current authenticated user. Use this on the server (RSC, route handlers,
 * server actions) so that all `findMany/create/update/delete` calls are
 * automatically filtered by `@@allow/@@deny` rules from the zmodel.
 *
 * Cast back to `PrismaClient` so callers retain full Prisma typing (the
 * `enhance` return type is a broader `DbClientContract` that loses model
 * shapes).
 */
export async function getEnhancedDb(): Promise<PrismaClient> {
  const session = await auth();
  const user = session?.user
    ? { id: session.user.id, role: session.user.role }
    : undefined;
  return enhance(prisma, { user }) as unknown as PrismaClient;
}
