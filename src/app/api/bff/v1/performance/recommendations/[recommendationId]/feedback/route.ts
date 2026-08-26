import { NextResponse, type NextRequest } from 'next/server';
import { domain } from '@/lib/domain-client';
import { getPersona, mapDomainError, problem } from '@/lib/bff';

export async function POST(
  req: NextRequest, ctx: { params: Promise<{ recommendationId: string }> },
): Promise<NextResponse> {
  const { recommendationId } = await ctx.params;
  const persona = await getPersona();
  const body = await req.json().catch(() => null);
  const rating = body?.rating;
  if (rating !== 'UP' && rating !== 'DOWN') return problem(400, 'BFF-4002', 'rating must be UP or DOWN');
  try {
    await domain.feedback(persona.agentId, persona.agentId, recommendationId, rating);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return mapDomainError(e);
  }
}
