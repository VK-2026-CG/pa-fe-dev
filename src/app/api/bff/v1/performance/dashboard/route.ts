import { NextResponse, type NextRequest } from 'next/server';
import { composeDashboard } from '@/lib/compose/dashboard';
import { domain } from '@/lib/domain-client';
import { getPersona, mapDomainError, parseLens } from '@/lib/bff';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const persona = await getPersona();
  const parsed = parseLens(req.nextUrl.searchParams, persona);
  if ('error' in parsed) return parsed.error;
  try {
    return NextResponse.json(await composeDashboard(domain, persona, parsed.lens));
  } catch (e) {
    return mapDomainError(e);
  }
}
