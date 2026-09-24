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
function DeltaLine({ delta, full }: { delta: DeltaVM; full?: boolean }) {
  return (
    <span className="delta-line">
      <span className={`d ${toneFor(delta.sentiment)}`}>{formatDelta(delta)}</span>
      <span className="muted">{t(full ? 'insights.delta.vsLastYear' : 'insights.delta.vsLY')}</span>
    </span>
  );
}

/**
 * w.metric.card — priority (`compact` in spec) 308×166 · simple 280×80
 * (carousel slides). Since v1.5.11/AC-P4-01-44, the `priority` face never
 * renders goal target/progress (regardless of `goal.state`) and has no nav
 * icon, converging its OK-state markup with the `simple` face's
 * value+delta-on-one-row layout; only the inline "(variant)" subtitle still
 * differs between the two. Goal target/progress remain valid VM fields,
 * still rendered on the Metric Detail (S-P4-02) screen.
 */
export function MetricCard({ vm, variant = 'priority' }: { vm: MetricCardVM; variant?: 'priority' | 'simple' }) {
  // A metric with no approved upstream source keeps its title and nav, but has
  // no value to show — never substitute a zero (VM 1.5.0 / C1 §7.13).
  const dataState = vm.dataState ?? 'OK';
  const stateText = dataState === 'PROCESSING'
    ? t('insights.state.processing.title')
    : t('insights.state.empty.title');
  return (
    <Link to={href(vm.nav)} className={`mcard ${variant === 'simple' ? 'simple' : ''}`}>
      <div className="head">
        <span>
          <span className="name">{t(`insights.metric.${vm.metricCode}.title`)}</span>
          {variant === 'priority' && vm.variant && (
            <span className="variant"> ({t(`insights.variant.${vm.variant}`)})</span>
          )}
        </span>
      </div>
      {dataState !== 'OK' ? (
        <div className="value-block">
          <div className="goal-line">{stateText}</div>
        </div>
      ) : (
        <div className="spread foot" style={{ alignItems: 'flex-end' }}>
          <span className="value">{formatScalar(vm.value, vm.valueDisplay === 'COMPACT')}</span>
          {vm.delta && <DeltaLine delta={vm.delta} full />}
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
function GaugeCardBody({ s, metricCode, valueOnly = false, repricing = true }: { s: GaugeSectionVM; metricCode: string; valueOnly?: boolean; repricing?: boolean }) {
  const R = 90; const C = 2 * Math.PI * R; const SWEEP = 0.75;
  // AC-P4-02-24: heading is the variant alone when one is present.
  const heading = s.variant
    ? t(`insights.variant.${s.variant}`)
    : t(`insights.metric.${metricCode}.title`);
  // AC-P4-02-23: value-only face — no donut. Repricing metrics (TPC/PTPC)
  // name the variant and drop penders; the others (FYP/FYC/AVERAGE_CASE_SIZE)
  // need no heading — the page title already names the metric, and the
  // variant the BFF still stamps on their gauge carries no meaning without a
  // "With repricing" counterpart — and keep their money penders
  // (AC-P4-02-39) as a second value line, since the donut legend is gone.
  if (valueOnly) {
    return (
      <>
        {repricing && <div className="title16">{heading}</div>}
        <div className="gauge-value-only">
          <span className="k muted">{t('insights.gauge.collected')}</span>
          <span className="v">{formatScalar(s.collected)}</span>
          {!repricing && s.penders && (
            <>
              <span className="k muted gauge-penders-k">{t('insights.gauge.penders')}</span>
              <span className="v2">{formatScalar(s.penders)}</span>
            </>
          )}
        </div>
      </>
    );
  }
  return (
    <>
      <div className="title16">{heading}</div>
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
    </>
  );
}
export function GaugeDonut({ s, metricCode }: { s: GaugeSectionVM; metricCode: string }) {
  return (
    <div className="card pad">
      <GaugeCardBody s={s} metricCode={metricCode} />
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
/** Series token per measure index — shared by bars and legend (no raw colors). */
const seriesFill = (mi: number) => (mi === 0 ? 'var(--color-chart-prior)' : 'var(--color-chart-primary)');

export function BarComparison({ s, metricCode }: { s: BarComparisonSectionVM; metricCode: string }) {
  if (s.layout === 'STACKED' && s.totals) return <StackedBarComparison s={s} totals={s.totals} metricCode={metricCode} />;
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

/**
 * `stacked-bars` face (S-P4-02 v1.13.0, AC-P4-02-42/43): each year's measures
 * stack bottom-up in `measures[]` order (MANPOWER: Existing Agents + New
 * Recruits). The total label and the only delta chip come from `totals[]` —
 * never summed here. Segment tokens are provisional (no approved baseline).
 */
function StackedBarComparison({ s, totals, metricCode }: {
  s: BarComparisonSectionVM; totals: NonNullable<BarComparisonSectionVM['totals']>; metricCode: string;
}) {
  const num = (v: BarComparisonSectionVM['measures'][number]['points'][number]['value']) =>
    (v.kind === 'MONEY' ? Number(v.amount) : v.value);
  const max = Math.max(...totals.map((t) => num(t.value)), 1);
  const W = 311; const H = 160; const plotH = 100; const baseY = 130; const barW = 44;
  const groupW = W / s.years.length;
  return (
    <div className="card pad bars-stacked">
      <div className="title16">{t(`insights.metric.${metricCode}.title`)}</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t(`insights.metric.${metricCode}.title`)}>
        {s.years.map((year, yi) => {
          const total = totals.find((tt) => tt.year === year);
          const x = yi * groupW + groupW / 2 - barW / 2;
          let y = baseY;
          const segs = s.measures.map((m, mi) => {
            const p = m.points.find((pt) => pt.year === year);
            if (!p) return null;
            const h = (num(p.value) / max) * plotH;
            y -= h;
            return <rect key={`${year}-${m.measureCode ?? mi}`} className="bar-seg" x={x} y={y} width={barW} height={h} fill={seriesFill(mi)} />;
          });
          const topY = total ? baseY - Math.max(4, (num(total.value) / max) * plotH) : y;
          return (
            <g key={year}>
              {segs}
              {total?.change && (
                <text x={x + barW / 2} y={topY - 18} textAnchor="middle" className="chart-delta"
                  fill={total.change.sentiment === 'NEGATIVE' ? 'var(--tone-danger)' : 'var(--tone-success)'}>
                  {formatDelta(total.change)}
                </text>
              )}
              {total && (
                <text x={x + barW / 2} y={topY - 5} textAnchor="middle" className="chart-point">
                  {total.value.kind === 'MONEY' ? formatScalar(total.value).replace('RM ', '') : formatScalar(total.value)}
                </text>
              )}
              <text x={yi * groupW + groupW / 2} y={H - 8} textAnchor="middle" className="chart-axis">{year}</text>
            </g>
          );
        })}
      </svg>
      <div className="spread caption muted">
        <span>{s.axisUnitCode ? t(`insights.axis.${s.axisUnitCode}`) : ''}</span>
        <span className="row" style={{ gap: 12 }}>
          {s.measures.map((m, mi) => m.measureCode && (
            <span key={m.measureCode}>
              <span style={{ color: seriesFill(mi) }}>■</span>{' '}
              {t(`insights.measure.${m.measureCode}`)}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

/* ── w.metric-detail.comparison — YoY card (rows 38h, growth Tag) ──────── */
/**
 * AC-P4-02-24/25: rows render the bare year with a muted "Collected"
 * subtitle (no "YTD " prefix — the period lives in the Time pill), and the
 * change renders as a toned delta line under the current-year value instead
 * of a separate labelled "% Growth" row. `showHeading` is false inside the
 * combined card, where the card heading already names the variant.
 */
function ComparisonCardBody({
  s, metricCode, labelKey, deltaLine = false, showHeading = true, period,
}: { s: ComparisonSectionVM; metricCode: string; labelKey: string; deltaLine?: boolean; showHeading?: boolean; period?: string }) {
  const yearLabel = (y: number) => (deltaLine ? String(y) : `YTD ${y}`);
  return (
    <>
      {showHeading ? (
        <div className="title14">
          {t(`insights.metric.${metricCode}.title`)}
          {s.variant ? ` ${t(`insights.variant.${s.variant}`)}` : ''}
        </div>
      ) : (
        // AC-P4-02-28: "{period} Comparison" heads the comparison half; the
        // card heading above it already names the variant.
        period && (
          <div className="title14">
            {t('insights.detail.comparisonTitle', { period: t(`insights.period.${period}`) })}
          </div>
        )
      )}
      <div className={`yoy-row${deltaLine ? ' yoy-row-tall' : ''}`} style={{ marginTop: 8 }}>
        <span>
          <span className="k">{yearLabel(s.currentYear)}</span>
          <span className="sub" style={{ display: 'block' }}>{t('insights.comparison.collected')}</span>
        </span>
        {deltaLine ? (
          <span className="yoy-value">
            <span className="v">{formatScalar(s.current)}</span>
            <DeltaLine delta={s.change} />
          </span>
        ) : (
          <span className="v">{formatScalar(s.current)}</span>
        )}
      </div>
      <hr className="hairline" />
      <div className="yoy-row">
        <span>
          <span className="k">{yearLabel(s.priorYear)}</span>
          <span className="sub" style={{ display: 'block' }}>{t('insights.comparison.collected')}</span>
        </span>
        <span className="v text-semibold">{formatScalar(s.prior)}</span>
      </div>
      {/* AC-P4-02-25 replaces this labelled row with the delta line above, but
          only for the TPC/PTPC combined card — AC-P4-02-13/-03 still require
          it for standalone comparison cards (persistency, productivity, …, and
          manpower — PCT since S-P4-02 v1.13.0, pre-rounded per R-PCT-ROUNDUP). */}
      {!deltaLine && (
        <>
          <hr className="hairline" />
          <div className="yoy-row" style={{ height: 36 }}>
            <span className="k">{t(labelKey)}</span>
            <DeltaBadge delta={s.change} />
          </div>
        </>
      )}
    </>
  );
}
export function ComparisonCard({ s, metricCode, labelKey }: { s: ComparisonSectionVM; metricCode: string; labelKey: string }) {
  return (
    <div className="card pad">
      <ComparisonCardBody s={s} metricCode={metricCode} labelKey={labelKey} />
    </div>
  );
}

/**
 * w.metric-detail.gauge + w.metric-detail.comparison combined card
 * (MetricDetail_S-P4-02 v1.3.0, AC-P4-02-21, TPC/PTPC only). One bordered
 * card instead of two: stacked with a horizontal divider below
 * breakpoint.desktop, two columns with a vertical divider at
 * breakpoint.desktop and above (`.gauge-comparison` in dls.css).
 *
 * v1.4.0 adds the bare-year rows + delta line (AC-P4-02-24/25); v1.5.0 makes
 * the value-only gauge face apply at every breakpoint (AC-P4-02-23 amended,
 * desktop evidence) and adds the "{period} Comparison" heading
 * (AC-P4-02-28).
 */
export function GaugeComparisonCard({
  gauge, comparison, metricCode, labelKey, period, repricing = true,
}: { gauge: GaugeSectionVM; comparison?: ComparisonSectionVM; metricCode: string; labelKey: string; period?: string; repricing?: boolean }) {
  // No comparison in the payload (e.g. no prior-year data): the same card
  // keeps its value-only face, content-sized, rather than falling back to
  // the standalone donut.
  return (
    <div className={`card pad gauge-comparison${comparison ? '' : ' gauge-only'}`}>
      <div className="gc-gauge">
        <GaugeCardBody s={gauge} metricCode={metricCode} valueOnly repricing={repricing} />
      </div>
      {comparison && (
        <>
          <div className="gc-divider" />
          <div className="gc-comparison">
            <ComparisonCardBody
              s={comparison} metricCode={metricCode} labelKey={labelKey}
              deltaLine showHeading={false} period={period}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ── Variant value / penders — single-row YoY cards (6588:18661) ───────── */
export function VariantValueCard({ s }: { s: VariantValueSectionVM }) {
  return (
    <div className="card pad">
      {/* AC-P4-02-24: variant-only heading, bare year. */}
      <div className="title14">{t(`insights.variant.${s.variant}`)}</div>
      <div className="yoy-row" style={{ marginTop: 8 }}>
        <span>
          <span className="k">{s.periodLabelYear}</span>
          <span className="sub" style={{ display: 'block' }}>{t('insights.comparison.collected')}</span>
        </span>
        <span className="v">{formatScalar(s.value)}</span>
      </div>
    </div>
  );
}
/**
 * AC-P4-02-26: a single-row card — label left, value right. Non-navigable
 * until the link destination is confirmed (OQ-30); no "Cases" unit until its
 * copy key exists.
 */
export function PendersCard({ s }: { s: PendersSectionVM }) {
  return (
    <div className="card pad penders-card">
      <div className="yoy-row">
        <span className="k">{t('insights.detail.penders')}</span>
        <span className="v">{formatScalar(s.value)}</span>
      </div>
    </div>
  );
}

/* ── w.metric-detail.breakdown-table — header 40h / rows 48h / 177+116 ─── */
export function BreakdownTable({ s }: { s: BreakdownSectionVM }) {
  return (
    <div className="card pad">
      {/* AC-P4-02-30: card heading is the variant alone, matching the
          variant-only convention already used for variant.with-repricing
          (AC-P4-02-24). The shared "Breakdown by Product" heading lives once
          above the card(s), in MetricDetailMY. */}
      <div className="title14" style={{ marginBottom: 8 }}>
        {t(`insights.variant.${s.variant}`)}
      </div>
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
  );
}

/* Comparison label per metric (spec S-P4-02 A1). */
export function comparisonLabelKey(metricCode: string, display: 'PCT' | 'PP' | 'ABS'): string {
  if (metricCode === 'MANPOWER') return 'insights.comparison.manpowerGrowth';
  if (metricCode === 'PRODUCTIVITY') return 'insights.comparison.productivityChange';
  if (metricCode === 'ACTIVITY_RATIO') return 'insights.comparison.activityRatioChange';
  // S-P4-02 v1.16.0 (AC-P4-02-52): ACS change is a %, so "Absolute Change" no longer fits.
  if (metricCode === 'AVERAGE_CASE_SIZE') return 'insights.comparison.averageCaseSizeChange';
  if (metricCode.startsWith('PERSISTENCY')) return 'insights.comparison.persistencyChange';
  if (metricCode === 'NEW_RECRUIT_CONTRACTED') return 'insights.comparison.pctChange'; // OQ-12: design label kept
  return display === 'PCT' ? 'insights.comparison.growth' : 'insights.comparison.pctChange';
}
