import { NextResponse, type NextRequest } from 'next/server';
import type { HistoryWindow } from '@spec/performance-vm';
import { composeHistory } from '@/lib/compose/history';
import { domain } from '@/lib/domain-client';
import { CONFIG } from '@/lib/config';
import { getPersona, mapDomainError, parseLens, problem } from '@/lib/bff';

export async function GET(
  req: NextRequest, ctx: { params: Promise<{ metricCode: string }> },
): Promise<NextResponse> {
  const { metricCode } = await ctx.params;
  const persona = await getPersona();
  const parsed = parseLens(req.nextUrl.searchParams, persona);
  if ('error' in parsed) return parsed.error;
  const window = (req.nextUrl.searchParams.get('window') ?? CONFIG.screens.history.defaultWindow) as HistoryWindow;
  if (!CONFIG.screens.history.windows.includes(window)) {
    return problem(400, 'BFF-4000', 'Invalid window', window);
  }
  try {
    return NextResponse.json(await composeHistory(domain, persona, metricCode, parsed.lens, window));
  } catch (e) {
    return mapDomainError(e);
  }
}
