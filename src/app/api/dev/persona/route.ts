import { NextResponse, type NextRequest } from 'next/server';
import { PERSONA_COOKIE, PERSONAS } from '@/lib/persona';

/** Dev-only persona switcher (stub auth). */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => null);
  const id = body?.persona;
  if (!PERSONAS.some((p) => p.id === id)) {
    return NextResponse.json({ title: 'Unknown persona', status: 400, code: 'DEV-4000' }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true, persona: id });
  res.cookies.set(PERSONA_COOKIE, id, { path: '/', httpOnly: false });
  return res;
}
