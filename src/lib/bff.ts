import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Scope, TeamView } from '@spec/performance-vm';
import { DEFAULT_PERSONA, PERSONA_COOKIE, personaById, isLeader, type Persona } from './persona';
import type { LensInput } from './compose/shared';

export async function getPersona(): Promise<Persona> {
  const jar = await cookies();
  return personaById(jar.get(PERSONA_COOKIE)?.value ?? DEFAULT_PERSONA);
}

export function problem(status: number, code: string, title: string, detail?: string): NextResponse {
  return NextResponse.json({ title, status, code, ...(detail ? { detail } : {}) }, { status });
}

const PERIODS = new Set(['MTD', 'QTD', 'YTD']);
const BLS = new Set(['ALL', 'INSURANCE', 'TAKAFUL']);
const BASES = new Set(['STANDARD', 'SCHEME']);

/** Parse + entitlement-guard the standard lens (D-14 mirrored at the BFF). */
export function parseLens(sp: URLSearchParams, persona: Persona): { lens: LensInput } | { error: NextResponse } {
  const period = sp.get('period') ?? 'YTD';
  const businessLine = sp.get('businessLine') ?? 'ALL';
  const basis = sp.get('basis') ?? 'STANDARD';
  const scope = (sp.get('scope') ?? 'SELF') as Scope;
  const teamViewRaw = sp.get('teamView');
  if (!PERIODS.has(period)) return { error: problem(400, 'BFF-4000', 'Invalid period', period) };
  if (!BLS.has(businessLine)) return { error: problem(400, 'BFF-4000', 'Invalid businessLine', businessLine) };
  if (!BASES.has(basis)) return { error: problem(400, 'BFF-4000', 'Invalid basis', basis) };
  if (scope !== 'SELF' && scope !== 'TEAM') return { error: problem(400, 'BFF-4000', 'Invalid scope', scope) };
  if (scope === 'TEAM' && !isLeader(persona)) {
    return { error: problem(403, 'BFF-4032', 'scope=TEAM requires a leader persona') };
  }
  let teamView: TeamView | undefined;
  if (scope === 'TEAM') {
    teamView = (teamViewRaw as TeamView | null) ?? 'DIRECT';
    if (teamView !== 'DIRECT' && teamView !== 'GROUP') return { error: problem(400, 'BFF-4000', 'Invalid teamView', String(teamViewRaw)) };
    if (teamView === 'GROUP' && persona.level !== 'P2') {
      return { error: problem(403, 'BFF-4031', 'teamView=GROUP requires a P2-level leader') };
    }
  }
  return {
    lens: {
      period: period as LensInput['period'],
      businessLine: businessLine as LensInput['businessLine'],
      basis: basis as LensInput['basis'],
      scope,
      ...(teamView ? { teamView } : {}),
    },
  };
}

export function mapDomainError(e: unknown): NextResponse {
  const err = e as { status?: number; code?: string; title?: string; message?: string };
  const status = typeof err.status === 'number' ? err.status : 502;
  return problem(status, err.code ?? 'BFF-5020', err.title ?? 'Upstream domain error', err.message);
}
