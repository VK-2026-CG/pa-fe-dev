import { NextResponse } from 'next/server';

/**
 * DRAFT (S-P4-05, specVersion 0.9.0): proposed BenefitCardVM payload behind
 * the draft flag — the benefits domain contract is OQ-17/18. Data mirrors the
 * P4-uplift mock. Do NOT extend without a spec ruling.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    draft: true,
    tabs: ['BONUS', 'CONTESTS'],
    bonus: [
      {
        benefitCode: 'HPFB', title: 'High Producer Fringe Benefit (HPFB)',
        rate: { pct: 3, sentiment: 'POSITIVE' }, assessmentYear: 2026,
        progress: {
          min: { kind: 'MONEY', amount: '60000.00', currency: 'MYR' },
          current: { kind: 'MONEY', amount: '70000.00', currency: 'MYR' },
          max: { kind: 'MONEY', amount: '89000.00', currency: 'MYR' },
        },
        pinned: false,
      },
      { benefitCode: 'HPFB', title: 'High Performance Fringe Benefit (HPFB)', rate: { pct: 3, sentiment: 'POSITIVE' }, assessmentYear: 2026, statusSentiment: 'POSITIVE', pinned: false },
      { benefitCode: 'HPFB', title: 'High Performance Fringe Benefit (HPFB)', rate: { pct: 0, sentiment: 'NEGATIVE' }, assessmentYear: 2026, statusSentiment: 'NEGATIVE', pinned: false },
    ],
    contests: [],
  });
}
