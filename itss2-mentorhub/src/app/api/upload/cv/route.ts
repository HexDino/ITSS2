import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';

/**
 * CV upload endpoint.
 * - Auth required; the file is always stored under the current user's id.
 * - Validates Content-Type AND magic bytes (`%PDF`) to reject spoofed MIME.
 * - Stores file under <project>/private/uploads/cv/ (NOT inside /public),
 *   then exposes it via /api/cv/<filename> which enforces RBAC.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  if (session.user.role !== 'STUDENT') {
    return NextResponse.json({ error: 'STUDENT_ONLY' }, { status: 403 });
  }

  // Rate-limit uploads to mitigate abuse (5/hour per user).
  const rl = rateLimit(`cv-upload:${session.user.id}`, { capacity: 5, refillPerSec: 5 / 3600 });
  if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF_ONLY' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'TOO_LARGE' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  // Magic bytes check: PDF files start with "%PDF" (0x25 0x50 0x44 0x46).
  if (
    buffer.length < 4 ||
    buffer[0] !== 0x25 ||
    buffer[1] !== 0x50 ||
    buffer[2] !== 0x44 ||
    buffer[3] !== 0x46
  ) {
    return NextResponse.json({ error: 'NOT_PDF' }, { status: 400 });
  }

  const dir = path.join(process.cwd(), 'private', 'uploads', 'cv');
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  // Filename embeds the owner's userId so the access-control route can
  // re-verify ownership without an extra DB lookup.
  const filename = `${session.user.id}-${Date.now()}.pdf`;
  await writeFile(path.join(dir, filename), buffer);

  const url = `/api/cv/${filename}`;
  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: { cvUrl: url },
  });

  return NextResponse.json({ ok: true, url });
}

export const runtime = 'nodejs';
