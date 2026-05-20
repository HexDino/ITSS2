import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

/**
 * Local CV upload endpoint (MVP). Stores PDFs under /public/uploads/cv.
 * In production, swap to S3/UploadThing.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });
  if (file.type !== 'application/pdf') return NextResponse.json({ error: 'PDF_ONLY' }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'TOO_LARGE' }, { status: 400 });

  const dir = path.join(process.cwd(), 'public', 'uploads', 'cv');
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const filename = `${session.user.id}-${Date.now()}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/cv/${filename}`;
  await prisma.studentProfile.update({
    where: { userId: session.user.id },
    data: { cvUrl: url },
  });

  return NextResponse.json({ ok: true, url });
}

export const runtime = 'nodejs';
