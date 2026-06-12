import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

/**
 * Public image upload endpoint for threads and answers.
 * Stored under public/uploads/images/ and returned with absolute public URL path.
 */
export async function POST(req: Request) {
  const hdrs = await headers();
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0]?.trim() || hdrs.get('x-real-ip') || 'unknown';

  // Rate-limit image uploads to mitigate abuse (20/hour per IP).
  const rl = rateLimit(`image-upload:${ip}`, { capacity: 20, refillPerSec: 20 / 3600 });
  if (!rl.allowed) return NextResponse.json({ error: 'RATE_LIMIT' }, { status: 429 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'NO_FILE' }, { status: 400 });

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'IMAGE_ONLY' }, { status: 400 });
  }

  // Limit size to 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'TOO_LARGE' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const dir = path.join(process.cwd(), 'public', 'uploads', 'images');
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const fileExt = file.type.split('/')[1];
  const filename = `${crypto.randomUUID()}.${fileExt}`;
  await writeFile(path.join(dir, filename), buffer);

  const url = `/uploads/images/${filename}`;
  return NextResponse.json({ ok: true, url });
}

export const runtime = 'nodejs';
