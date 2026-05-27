import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Protected CV download.
 * URL shape: /api/cv/<userId>-<timestamp>.pdf
 *
 * Access rules:
 *  - The owning student (id encoded in filename) always allowed.
 *  - Admin always allowed.
 *  - Employer allowed if the student has an Application to a Job belonging
 *    to the employer's company.
 */
export const runtime = 'nodejs';

// Strict filename: lowercase hex/cuid prefix, dash, digits, .pdf — no traversal.
const FILE_RE = /^([a-z0-9]+)-(\d+)\.pdf$/i;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { filename } = await params;
  const m = filename.match(FILE_RE);
  if (!m) return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  const ownerId = m[1];

  let allowed = false;
  if (session.user.role === 'ADMIN' || session.user.id === ownerId) {
    allowed = true;
  } else if (session.user.role === 'EMPLOYER') {
    const ep = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      select: { companyId: true },
    });
    if (ep?.companyId) {
      const app = await prisma.application.findFirst({
        where: { studentId: ownerId, job: { companyId: ep.companyId } },
        select: { id: true },
      });
      allowed = !!app;
    }
  }

  if (!allowed) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  const filePath = path.join(process.cwd(), 'private', 'uploads', 'cv', filename);
  if (!existsSync(filePath)) {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }

  const buf = await readFile(filePath);
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
