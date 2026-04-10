import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

// This API route is ONLY accessible during dev mode (port 3001).
// It allows the browser-side spatial editor to read component source files
// so the agent bridge can send the current code to the AI for redesigning.

const SITE_ROOT = path.resolve(process.cwd());

// Allowlist: only these path prefixes are readable
const ALLOWED_PREFIXES = ['src/components/', 'src/app/'];

export async function GET(req: NextRequest) {
  const filePath = req.nextUrl.searchParams.get('path') ?? '';

  // Safety: only allow reads within the allowlist
  const normalised = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const isAllowed = ALLOWED_PREFIXES.some((prefix) => normalised.startsWith(prefix));

  if (!isAllowed) {
    return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
  }

  const abs = path.join(SITE_ROOT, normalised);

  // Prevent directory traversal
  if (!abs.startsWith(SITE_ROOT)) {
    return NextResponse.json({ error: 'Path traversal blocked' }, { status: 403 });
  }

  try {
    const source = readFileSync(abs, 'utf-8');
    return NextResponse.json({ source });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
