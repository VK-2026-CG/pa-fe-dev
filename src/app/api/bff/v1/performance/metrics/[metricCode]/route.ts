import { NextResponse, type NextRequest } from 'next/server';
import { composeMetricDetail } from '@/lib/compose/metric-detail';
import { domain } from '@/lib/domain-client';
import { getPersona, mapDomainError, parseLens } from '@/lib/bff';

export async function GET(
  req: NextRequest, ctx: { params: Promise<{ metricCode: string }> },
): Promise<NextResponse> {
  const { metricCode } = await ctx.params;
  const persona = await getPersona();
  const parsed = parseLens(req.nextUrl.searchParams, persona);
  if ('error' in parsed) return parsed.error;
  try {
    return NextResponse.json(await composeMetricDetail(domain, persona, metricCode, parsed.lens));
  } catch (e) {
    return mapDomainError(e);
  }
}
