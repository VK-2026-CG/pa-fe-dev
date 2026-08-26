import { NextResponse, type NextRequest } from 'next/server';
import type { Scope } from '@spec/performance-vm';
import { composeCustomize } from '@/lib/compose/customize';
import { domain } from '@/lib/domain-client';
import { isLeader } from '@/lib/persona';
import { getPersona, mapDomainError, problem } from '@/lib/bff';

function scopeOf(req: NextRequest): Scope { return (req.nextUrl.searchParams.get('scope') ?? 'SELF') as Scope; }

export async function GET(req: NextRequest): Promise<NextResponse> {
  const persona = await getPersona();
  const scope = scopeOf(req);
  if (scope === 'TEAM' && !isLeader(persona)) return problem(403, 'BFF-4032', 'scope=TEAM requires a leader persona');
  try {
    return NextResponse.json(await composeCustomize(domain, persona, scope));
  } catch (e) {
    return mapDomainError(e);
  }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
  const persona = await getPersona();
  const scope = scopeOf(req);
  if (scope === 'TEAM' && !isLeader(persona)) return problem(403, 'BFF-4032', 'scope=TEAM requires a leader persona');
  const body = await req.json().catch(() => null);
  if (!body) return problem(400, 'BFF-4001', 'Body must be JSON');
  try {
    await domain.putPreferences(persona.agentId, persona.agentId, scope, body);
    return NextResponse.json(await composeCustomize(domain, persona, scope));
  } catch (e) {
    return mapDomainError(e);
  }
}
