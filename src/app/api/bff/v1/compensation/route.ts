import { NextResponse, type NextRequest } from 'next/server';

/**
 * DRAFT (S-P4-06, specVersion 0.9.0): proposed CompBonusRowVM payload —
 * compensation domain ownership is OQ-18. Data mirrors the P4-uplift mock,
 * incl. the stale-data banner variant (?stale=1).
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const stale = req.nextUrl.searchParams.get('stale') === '1';
  return NextResponse.json({
    draft: true,
    tabs: ['PAID_COMMISSION', 'RETIREMENT'],
    ...(stale ? { staleness: { asOnDate: '2026-03-09' } } : {}),
    rows: [
      { bonusCode: 'PERSISTENCY_BONUS_Y1', amount: { kind: 'MONEY', amount: '45000.00', currency: 'MYR' }, status: 'PAID', paidOn: '2026-08-12' },
      { bonusCode: 'PERSISTENCY_BONUS_Y2', amount: { kind: 'MONEY', amount: '27000.00', currency: 'MYR' }, status: 'PENDING' },
      { bonusCode: 'HPFB', amount: { kind: 'MONEY', amount: '33495.70', currency: 'MYR' }, status: 'PENDING' },
    ],
    retirement: [],
  });
}
