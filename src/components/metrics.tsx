import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { href } from '@/lib/nav';
import { formatScalar, formatDelta, toneFor } from '@/lib/format';
import { Icon, ProgressBar, Tag } from '@/dls-stub';
import { clampPct } from '@/headless';
import type {
  BarComparisonSectionVM, BreakdownSectionVM, ComparisonSectionVM, DeltaVM, GaugeSectionVM,
  MetricCardVM, MilestoneCardVM, PendersSectionVM, ThresholdGaugeSectionVM, VariantValueSectionVM,
} from '@spec/performance-vm';

export function DeltaBadge({ delta }: { delta: DeltaVM }) {
  return <Tag tone={toneFor(delta.sentiment)}>{formatDelta(delta)}</Tag>;
}

/** "+27% vs last year" line (Figma 6588:17659: toned delta + muted suffix). */
function DeltaLine({ delta }: { delta: DeltaVM }) {
  return (
    <span className="delta-line">
      <span className={`d ${toneFor(delta.sentiment)}`}>{formatDelta(delta)}</span>
      <span className="muted">{t('insights.delta.vsLY')}</span>
    </span>
  );
}

/* ── w.metric.card — priority 308×166 · simple 280×80 (carousel slides) ── */
export function MetricCard({ vm, variant = 'priority' }: { vm: MetricCardVM; variant?: 'priority' | 'simple' }) {
  const showGoal = variant === 'priority' && vm.showGoal;
  const goalText = vm.goal?.state === 'SET' && vm.goal.target
    ? `/ ${formatScalar(vm.goal.target)}`
    : `/ ${t('insights.goal.notSet')}`;
  return (
    <Link to={href(vm.nav)} className={`mcard ${variant === 'simple' ? 'simple' : ''}`}>
      <div className="head">
        <span>
          <span className="name">{t(`insights.metric.${vm.metricCode}.title`)}</span>
          {variant === 'priority' && vm.variant && (
            <span className="variant" style={{ display: 'block' }}>{t(`insights.variant.${vm.variant}`)}</span>
          )}
        </span>
        <Icon token="arrow-right-up-line" size={24} tone="var(--color-text)" />
      </div>
      {variant === 'priority' ? (
        <>
          <div className="value-block">
            <div className="value">{formatScalar(vm.value)}</div>
            {showGoal && <div className="goal-line">{goalText}</div>}
          </div>
          <div className="foot">
            {vm.delta && <DeltaLine delta={vm.delta} />}
            {showGoal && vm.goal?.state === 'SET' && <ProgressBar pct={clampPct(vm.goal.progressPct)} />}
          </div>
        </>
      ) : (
        <div className="spread foot" style={{ alignItems: 'flex-end' }}>
          <span className="value">{formatScalar(vm.value)}</span>
          {vm.delta && <DeltaLine delta={vm.delta} />}
        </div>
      )}
    </Link>
  );
}

/* ── w.milestone.card — 308×238 (Figma 6588:16772) ─────────────────────── */
export function MilestoneCard({ vm }: { vm: MilestoneCardVM }) {
  return (
    <Link to={href(vm.nav)} className="milecard">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>
          <span className="title14">{t(`insights.milestone.program.${vm.programCode}`)}</span>
          <span className="caption muted" style={{ display: 'block' }}>{t(`insights.variant.${vm.variant}`)}</span>
        </span>
        <Icon token="arrow-right-up-line" size={24} tone="var(--color-text)" />
      </div>
      <div className="status">
        <span>
          <span className="k" style={{ display: 'block' }}>{t('insights.milestone.currentStatus')}</span>
          <span className="v" style={{ color: 'var(--tone-success)' }}>{t(`insights.milestone.tier.${vm.currentTierCode}`)}</span>
        </span>
        {vm.nextTierCode && (
          <span style={{ textAlign: 'right' }}>
            <span className="k" style={{ display: 'block' }}>{t('insights.milestone.nextMilestone')}</span>
            <span className="v">{t(`insights.milestone.tier.${vm.nextTierCode}`)}</span>
          </span>
        )}
      </div>
      <ProgressBar pct={clampPct(vm.progressPct)} />
      <div className="measures">
        {vm.measures.map((m) => (
          <div key={m.measureCode}>
            <span className="k" style={{ display: 'block' }}>{t(`insights.measure.${m.measureCode}`)}</span>
            <span className="a" style={{ display: 'block' }}>{formatScalar(m.achieved).replace('RM ', '')}</span>
            <span className="t">/{formatScalar(m.target).replace('RM ', '')}</span>
          </div>
        ))}
      </div>
    </Link>
  );
}

/* ── w.metric-detail.gauge — card w/ 270×220 donut + legend (6588:18612) ─ */
export function GaugeDonut({ s, metricCode }: { s: GaugeSectionVM; metricCode: string }) {
  const R = 90; const C = 2 * Math.PI * R; const SWEEP = 0.75;
  return (
    <div className="card pad">
      <div className="title16">
        {t(`insights.metric.${metricCode}.title`)}
        {s.variant ? ` ${t(`insights.variant.${s.variant}`).toLowerCase()}` : ''}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="270" height="210" viewBox="0 0 270 210" role="img" aria-label={formatScalar(s.collected)}>
          <g transform="rotate(135 135 108)">
            <circle cx="135" cy="108" r={R} fill="none" stroke="var(--color-chart-primary-soft)" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${C * SWEEP} ${C}`} />
            <circle cx="135" cy="108" r={R} fill="none" stroke="var(--color-chart-primary)" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${C * SWEEP * 0.72} ${C}`} />
          </g>
          <text x="135" y="100" textAnchor="middle" className="chart-label">{t('insights.gauge.collected')}</text>
          <text x="135" y="124" textAnchor="middle" className="chart-value">{formatScalar(s.collected)}</text>
        </svg>
      </div>
      <div className="gauge-legend">
        <span>
          <span className="k"><span className="dot" style={{ background: 'var(--color-chart-primary)' }} />{t('insights.gauge.collected')}</span>
          <span className="v" style={{ display: 'block', marginLeft: 13 }}>{formatScalar(s.collected)}</span>
        </span>
        {s.penders && (
          <span>
            <span className="k"><span className="dot" style={{ background: 'var(--color-chart-primary-soft)' }} />{t('insights.gauge.penders')}</span>
            <span className="v" style={{ display: 'block', marginLeft: 13 }}>{formatScalar(s.penders)}</span>
          </span>
        )}
      </div>
    </div>
  );
}

/* ── w.metric-detail.threshold-gauge ───────────────────────────────────── */
export function ThresholdArc({ s, metricCode }: { s: ThresholdGaugeSectionVM; metricCode: string }) {
  const pct = Math.max(0, Math.min(100, s.current.value));
  const angle = Math.PI * (1 - pct / 100);
  const R = 92; const cx = 135; const cy = 118;
  const x = cx + R * Math.cos(angle); const y = cy - R * Math.sin(angle);
  const thAngle = Math.PI * (1 - s.threshold.value / 100);
  const tx1 = cx + (R - 14) * Math.cos(thAngle); const ty1 = cy - (R - 14) * Math.sin(thAngle);
  const tx2 = cx + (R + 14) * Math.cos(thAngle); const ty2 = cy - (R + 14) * Math.sin(thAngle);
  const tone = s.sentiment === 'POSITIVE' ? 'var(--tone-success)' : 'var(--tone-danger)';
  return (
    <div className="card pad">
      <div className="title16">{t(`insights.metric.${metricCode}.title`)}</div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg width="270" height="146" viewBox="0 0 270 138" role="img" aria-label={`${pct}%`}>
          <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="var(--tone-muted-bg)" strokeWidth="16" strokeLinecap="round" />
          <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${x} ${y}`} fill="none" stroke={tone} strokeWidth="16" strokeLinecap="round" />
          <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="var(--color-text)" strokeWidth="2.5" strokeDasharray="3 3" />
          <text x={cx} y={cy - 14} textAnchor="middle" className="chart-threshold-value">{pct}%</text>
        </svg>
      </div>
      <div className="gauge-legend">
        <span className="k"><span className="dot" style={{ background: tone }} />{t('insights.gaugeLegend.currentValue')}</span>
        <span className="k">┆ {t('insights.gaugeLegend.threshold')} {s.threshold.value}%</span>
      </div>
    </div>
  );
}

/* ── w.metric-detail.bar-comparison ────────────────────────────────────── */
export function BarComparison({ s, metricCode }: { s: BarComparisonSectionVM; metricCode: string }) {
  const all = s.measures.flatMap((m) => m.points.map((p) => (p.value.kind === 'MONEY' ? Number(p.value.amount) : p.value.value)));
  const max = Math.max(...all, 1);
  const grouped = s.measures.length > 1;
  const W = 311; const H = 160; const plotH = 100; const baseY = 130;
  const groupW = W / s.years.length;
  const barW = grouped ? 28 : 44;
  return (
    <div className="card pad">
      <div className="title16">{t(`insights.metric.${metricCode}.title`)}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(`insights.metric.${metricCode}.title`)}>
        {s.years.map((year, yi) => (
          <g key={year}>
            {s.measures.map((m, mi) => {
              const p = m.points.find((pt) => pt.year === year);
              if (!p) return null;
              const v = p.value.kind === 'MONEY' ? Number(p.value.amount) : p.value.value;
              const h = Math.max(4, (v / max) * plotH);
              const cxg = yi * groupW + groupW / 2;
              const xoff = grouped ? (mi === 0 ? -barW - 4 : 4) : -barW / 2;
              const xpos = cxg + xoff;
              const isAnchor = year === s.years[s.years.length - 1];
              const fill = grouped
                ? (mi === 0 ? 'var(--color-chart-prior)' : 'var(--color-chart-primary)')
                : (isAnchor ? 'var(--color-chart-primary)' : 'var(--color-chart-prior)');
              return (
                <g key={`${year}-${m.measureCode ?? mi}`}>
                  {p.change && (
                    <text x={xpos + barW / 2} y={baseY - h - 18} textAnchor="middle" className="chart-delta"
                      fill={p.change.sentiment === 'NEGATIVE' ? 'var(--tone-danger)' : 'var(--tone-success)'}>
                      {formatDelta(p.change)}
                    </text>
                  )}
                  <text x={xpos + barW / 2} y={baseY - h - 5} textAnchor="middle" className="chart-point">
                    {p.value.kind === 'MONEY' ? formatScalar(p.value).replace('RM ', '') : formatScalar(p.value)}
                  </text>
                  <rect x={xpos} y={baseY - h} width={barW} height={h} rx="4" fill={fill} />
                </g>
              );
            })}
            <text x={yi * groupW + groupW / 2} y={H - 8} textAnchor="middle" className="chart-axis">{year}</text>
          </g>
        ))}
      </svg>
      <div className="spread caption muted">
        <span>{s.axisUnitCode ? t(`insights.axis.${s.axisUnitCode}`) : ''}</span>
        {grouped && (
          <span className="row" style={{ gap: 12 }}>
            {s.measures.map((m, mi) => m.measureCode && (
              <span key={m.measureCode}>
                <span style={{ color: mi === 0 ? 'var(--color-chart-prior)' : 'var(--color-chart-primary)' }}>■</span>{' '}
                {t(`insights.measure.${m.measureCode}`)}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

/* ── w.metric-detail.comparison — YoY card (rows 38h, growth Tag) ──────── */
export function ComparisonCard({ s, metricCode, labelKey }: { s: ComparisonSectionVM; metricCode: string; labelKey: string }) {
  return (
    <div className="card pad">
      <div className="title14">
        {t(`insights.metric.${metricCode}.title`)}
        {s.variant ? ` ${t(`insights.variant.${s.variant}`)}` : ''}
      </div>
      <div className="yoy-row" style={{ marginTop: 8 }}>
        <span>
          <span className="k">{`YTD ${s.currentYear}`}</span>
          <span className="sub" style={{ display: 'block' }}>{t('insights.comparison.collected')}</span>
        </span>
        <span className="v">{formatScalar(s.current)}</span>
      </div>
      <hr className="hairline" />
      <div className="yoy-row">
        <span>
          <span className="k">{`YTD ${s.priorYear}`}</span>
          <span className="sub" style={{ display: 'block' }}>{t('insights.comparison.collected')}</span>
        </span>
        <span className="v text-semibold">{formatScalar(s.prior)}</span>
      </div>
      <hr className="hairline" />
      <div className="yoy-row" style={{ height: 36 }}>
        <span className="k">{t(labelKey)}</span>
        <DeltaBadge delta={s.change} />
      </div>
    </div>
  );
}

/* ── Variant value / penders — single-row YoY cards (6588:18661) ───────── */
export function VariantValueCard({ s, metricCode }: { s: VariantValueSectionVM; metricCode: string }) {
  return (
    <div className="card pad">
      <div className="title14">{t(`insights.metric.${metricCode}.title`)} {t(`insights.variant.${s.variant}`)}</div>
      <div className="yoy-row" style={{ marginTop: 8 }}>
        <span>
          <span className="k">{`YTD ${s.periodLabelYear}`}</span>
          <span className="sub" style={{ display: 'block' }}>{t('insights.comparison.collected')}</span>
        </span>
        <span className="v">{formatScalar(s.value)}</span>
      </div>
    </div>
  );
}
export function PendersCard({ s }: { s: PendersSectionVM }) {
  return (
    <div className="card pad">
      <div className="title14">{t('insights.detail.penders')}</div>
      <div className="yoy-row" style={{ marginTop: 8 }}>
        <span className="k">{`YTD (${s.periodLabelYear})`}</span>
        <span className="v">{formatScalar(s.value)}</span>
      </div>
    </div>
  );
}

/* ── w.metric-detail.breakdown-table — header 40h / rows 48h / 177+116 ─── */
export function BreakdownTable({ s, metricCode }: { s: BreakdownSectionVM; metricCode: string }) {
  return (
    <div>
      <div className="title14" style={{ marginBottom: 8 }}>
        {t('insights.detail.breakdownByProduct', { metric: `${t(`insights.metric.${metricCode}.title`)} ${t(`insights.variant.${s.variant}`).toLowerCase()}` })}
      </div>
      <div className="card pad">
        <div className="scroll-x">
          <table className="table">
            <thead>
              <tr>
                <th className="colfirst">{t('insights.detail.product')}</th>
                {s.columns.map((c) => <th key={c} className="num colval">{t(`insights.businessLine.${c}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {s.rows.map((r) => (
                <tr key={r.productCode}>
                  <td className="colfirst">{t(`insights.product.${r.productCode}`)}{r.weightPct !== undefined ? ` (${r.weightPct}%)` : ''}</td>
                  {s.columns.map((c) => {
                    const cell = r.cells.find((x) => x.businessLine === c);
                    return <td key={c} className="num colval">{cell ? formatScalar(cell.value) : '-'}</td>;
                  })}
                </tr>
              ))}
              <tr>
                <td className="colfirst total">{t('insights.detail.total')}</td>
                {s.columns.map((c) => {
                  const tot = s.totals.find((x) => x.businessLine === c);
                  return <td key={c} className="num colval total">{tot ? formatScalar(tot.value) : '-'}</td>;
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* Comparison label per metric (spec S-P4-02 A1). */
export function comparisonLabelKey(metricCode: string, display: 'PCT' | 'PP' | 'ABS'): string {
  if (metricCode === 'MANPOWER') return 'insights.comparison.manpowerGrowth';
  if (metricCode === 'PRODUCTIVITY') return 'insights.comparison.productivityChange';
  if (metricCode === 'ACTIVITY_RATIO') return 'insights.comparison.activityRatioChange';
  if (metricCode === 'AVERAGE_CASE_SIZE') return 'insights.comparison.absoluteChange';
  if (metricCode.startsWith('PERSISTENCY')) return 'insights.comparison.persistencyChange';
  if (metricCode === 'NEW_RECRUIT_CONTRACTED') return 'insights.comparison.pctChange'; // OQ-12: design label kept
  return display === 'PCT' ? 'insights.comparison.growth' : 'insights.comparison.pctChange';
}
