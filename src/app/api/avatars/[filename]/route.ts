import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

const MIME: Record<string, string> = {
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  gif:  'image/gif',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  // Prevent path traversal
  if (!filename || filename.includes('/') || filename.includes('..')) {
    return new NextResponse(null, { status: 400 });
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const mimeType = MIME[ext];
  if (!mimeType) return new NextResponse(null, { status: 404 });

  try {
    const buffer = await readFile(path.join(process.cwd(), 'data', 'avatars', filename));
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
