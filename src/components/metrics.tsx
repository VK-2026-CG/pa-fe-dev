import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { href } from '@/lib/nav';
import { formatScalar, formatDetailScalar, formatDelta, toneFor } from '@/lib/format';
import { Icon, ProgressBar, Tag } from '@/dls-stub';
import { clampPct, useIsDesktop } from '@/headless';
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
export function MetricCard({ vm, variant = 'priority', navigable = true }: {
  vm: MetricCardVM; variant?: 'priority' | 'simple';
  /** S-P4-01 2.1.0 viewing mode: cards render without navigation (OQ-84). */
  navigable?: boolean;
}) {
  // A metric with no approved upstream source keeps its title and nav, but has
  // no value to show — never substitute a zero (VM 1.5.0 / C1 §7.13).
  const dataState = vm.dataState ?? 'OK';
  const stateText = dataState === 'PROCESSING'
    ? t('insights.state.processing.title')
    : t('insights.state.empty.title');
  // Every currency value on a priority or focus card uses TPC's compact form
  // ("11.9K"), at both SELF and TEAM scope; other kinds still follow `valueDisplay`.
  const compact = vm.valueDisplay === 'COMPACT' || vm.value?.kind === 'MONEY';
  // Persistency (CY / Y1 / Y2) is a yearly measure: no "vs last year" delta, a note under the value instead.
  const persistency = vm.metricCode.startsWith('PERSISTENCY_');
  return (
    <CardShell navigable={navigable} to={href(vm.nav)} className={`mcard ${variant === 'simple' ? 'simple' : ''} ${navigable ? '' : 'static'}`}>
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
      ) : persistency ? (
        <div className="foot persistency-foot">
          <span className="value">{formatScalar(vm.value, compact)}</span>
          <span className="persistency-note">{t('insights.dashboard.persistencyNote')}</span>
        </div>
      ) : (
        <div className="spread foot" style={{ alignItems: 'flex-end' }}>
          <span className="value">{formatScalar(vm.value, compact)}</span>
          {vm.delta && <DeltaLine delta={vm.delta} full />}
        </div>
      )}
    </CardShell>
  );
}

function CardShell({ navigable, to, className, children }: { navigable: boolean; to: string; className: string; children: ReactNode }) {
  return navigable ? <Link to={to} className={className}>{children}</Link> : <div className={className}>{children}</div>;
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
    // Figma 1:16160: the drill-down card heading is the sentence-case variant name ("Without repricing"), 18/24.
    const cardHeading = s.variant ? t(`insights.detail.variantHeading.${s.variant}`) : heading;
    return (
      <>
        {repricing && <div className="title16 dd-card-title">{cardHeading}</div>}
        <div className="gauge-value-only">
          <span className="k muted">{t('insights.gauge.collected')}</span>
          <span className="v">{formatDetailScalar(s.collected, metricCode)}</span>
          {!repricing && s.penders && (
            <>
              <span className="k muted gauge-penders-k">{t('insights.gauge.penders')}</span>
              <span className="v2">{formatDetailScalar(s.penders, metricCode)}</span>
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
        <svg width="270" height="210" viewBox="0 0 270 210" role="img" aria-label={formatDetailScalar(s.collected, metricCode)}>
          <g transform="rotate(135 135 108)">
            <circle cx="135" cy="108" r={R} fill="none" stroke="var(--color-chart-primary-soft)" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${C * SWEEP} ${C}`} />
            <circle cx="135" cy="108" r={R} fill="none" stroke="var(--color-chart-primary)" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${C * SWEEP * 0.72} ${C}`} />
          </g>
          <text x="135" y="100" textAnchor="middle" className="chart-label">{t('insights.gauge.collected')}</text>
          <text x="135" y="124" textAnchor="middle" className="chart-value">{formatDetailScalar(s.collected, metricCode)}</text>
        </svg>
      </div>
      <div className="gauge-legend">
        <span>
          <span className="k"><span className="dot" style={{ background: 'var(--color-chart-primary)' }} />{t('insights.gauge.collected')}</span>
          <span className="v" style={{ display: 'block', marginLeft: 13 }}>{formatDetailScalar(s.collected, metricCode)}</span>
        </span>
        {s.penders && (
          <span>
            <span className="k"><span className="dot" style={{ background: 'var(--color-chart-primary-soft)' }} />{t('insights.gauge.penders')}</span>
            <span className="v" style={{ display: 'block', marginLeft: 13 }}>{formatDetailScalar(s.penders, metricCode)}</span>
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

/* ── Metric Drill-down charts (Figma "Metric Drill downs - Mobile", 1:15845) ─────
 * Ring gauge, grouped/stacked bars and the "YTD Comparison" rows share ONE card
 * (chart · hairline · rows). Colours: Chart-Success #22C55E, Chart-Danger #D2042D,
 * Chart-Information #3B82F6, Chart-Neutral #A1A1AA — see the --chart-* tokens. */

const TWO_PI = Math.PI * 2;
const polar = (r: number, turns: number) => ({ x: 100 + r * Math.sin(turns * TWO_PI), y: 100 - r * Math.cos(turns * TWO_PI) });

/** Full-circle ring starting at 12 o'clock, clockwise, with an end dot and an optional threshold tick.
 *  Desktop (Figma 22:18658 Radial Ring): the end dot is a 3px white ring around the round cap (r10), the tick a
 *  30×5 Chart-Neutral pill with a 2px white outline, and both cast the component's soft drop shadows. */
function RingGauge({ pct, threshold, tone, label, desktop }: { pct: number; threshold?: number; tone: string; label: string; desktop?: boolean }) {
  const R = 90; const W = 20;
  const turns = Math.max(0, Math.min(100, pct)) / 100;
  const end = polar(R, turns);
  const arc = turns >= 1
    ? null
    : `M 100 ${100 - R} A ${R} ${R} 0 ${turns > 0.5 ? 1 : 0} 1 ${end.x} ${end.y}`;
  // Mobile tick: 28px line; desktop tick spans R±15 (30 long) with round caps folded into the length.
  const tick = threshold === undefined ? null : desktop
    ? { a: polar(R - 12.5, threshold / 100), b: polar(R + 12.5, threshold / 100) }
    : { a: polar(R - 14, threshold / 100), b: polar(R + 14, threshold / 100) };
  return (
    <svg className="ring-gauge" width="212" height="212" viewBox="-6 -6 212 212" role="img" aria-label={label}>
      {desktop && (
        <defs>
          <filter id="ring-dot-shadow" x="-60%" y="-60%" width="220%" height="220%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="2.67" stdDeviation="5.33" floodColor="#000" floodOpacity="0.12" />
          </filter>
          <filter id="ring-tick-shadow" x="-150%" y="-60%" width="400%" height="220%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#000" floodOpacity="0.15" />
          </filter>
        </defs>
      )}
      <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-surface-track)" strokeWidth={W} />
      {turns >= 1 && <circle cx="100" cy="100" r={R} fill="none" stroke={tone} strokeWidth={W} />}
      {arc && turns > 0 && <path d={arc} fill="none" stroke={tone} strokeWidth={W} strokeLinecap="round" />}
      {tick && desktop && (
        <g filter="url(#ring-tick-shadow)">
          <line x1={tick.a.x} y1={tick.a.y} x2={tick.b.x} y2={tick.b.y} stroke="var(--color-surface)" strokeWidth="9" strokeLinecap="round" />
          <line x1={tick.a.x} y1={tick.a.y} x2={tick.b.x} y2={tick.b.y} stroke="var(--chart-neutral)" strokeWidth="5" strokeLinecap="round" />
        </g>
      )}
      {tick && !desktop && (
        <>
          <line x1={tick.a.x} y1={tick.a.y} x2={tick.b.x} y2={tick.b.y} stroke="var(--color-surface)" strokeWidth="10" strokeLinecap="round" />
          <line x1={tick.a.x} y1={tick.a.y} x2={tick.b.x} y2={tick.b.y} stroke="var(--chart-neutral)" strokeWidth="6" strokeLinecap="round" />
        </>
      )}
      {turns > 0 && desktop && <circle cx={end.x} cy={end.y} r="10" fill="none" stroke="var(--color-surface)" strokeWidth="3" filter="url(#ring-dot-shadow)" />}
      {turns > 0 && !desktop && <circle cx={end.x} cy={end.y} r="9" fill={tone} stroke="var(--color-surface)" strokeWidth="3" />}
      <text x="100" y="100" textAnchor="middle" dominantBaseline="central" className="chart-threshold-value">{label}</text>
    </svg>
  );
}

/** Legend entry: coloured pill, muted label over a bold value (Figma "Current 95%" / "Threshold 90%"). */
function LegendItem({ colour, label, value, muted }: { colour: string; label: string; value?: string; muted?: boolean }) {
  return (
    <span className="legend-item">
      <i className="legend-pill" style={{ background: colour }} />
      <span className="legend-text">
        <span className="legend-label">{label}</span>
        {value !== undefined && <>{' '}<span className={`legend-value${muted ? ' muted' : ''}`}>{value}</span></>}
      </span>
    </span>
  );
}

/** "YTD Comparison" / "YTD Persistency" rows: year left, value right, delta under the current value. */
function YtdRows({ s, metricCode, period }: { s: ComparisonSectionVM; metricCode: string; period?: string }) {
  const persistency = metricCode.startsWith('PERSISTENCY_');
  const per = period ? t(`insights.period.${period}`) : '';
  return (
    <div className="ytd-rows">
      <div className="title14">
        {persistency ? t('insights.detail.persistencyTitle', { period: per }) : t('insights.detail.comparisonTitle', { period: per })}
      </div>
      <div className="ytd-row current">
        <span>{s.currentYear}</span>
        <span className="ytd-value">
          <b>{formatDetailScalar(s.current, metricCode)}</b>
          <DeltaLine delta={s.change} full />
        </span>
      </div>
      <div className="ytd-row">
        <span>{s.priorYear}</span>
        <span className="ytd-value"><b className="subtle">{formatDetailScalar(s.prior, metricCode)}</b></span>
      </div>
    </div>
  );
}

/** Chart + hairline + comparison rows in one card. */
export function DetailChartCard({ chart, comparison, metricCode, period }: {
  chart: ThresholdGaugeSectionVM | BarComparisonSectionVM; comparison?: ComparisonSectionVM; metricCode: string; period?: string;
}) {
  return (
    <div className={`card dchart-card${chart.type === 'BAR_COMPARISON' ? ' dchart-bars' : ' dchart-ring'}${chart.type === 'BAR_COMPARISON' && chart.layout === 'STACKED' ? ' bars-stacked' : ''}`}>
      {chart.type === 'THRESHOLD_GAUGE' ? <ThresholdRing s={chart} metricCode={metricCode} /> : <BarsChart s={chart} />}
      {comparison && (
        <>
          <hr className="dchart-divider" />
          <YtdRows s={comparison} metricCode={metricCode} period={period} />
        </>
      )}
    </div>
  );
}

/* ── w.metric-detail.threshold-gauge — ring (persistency, activity ratio) ─ */
function ThresholdRing({ s, metricCode }: { s: ThresholdGaugeSectionVM; metricCode: string }) {
  const pct = Math.max(0, Math.min(100, s.current.value));
  const desktop = useIsDesktop();
  // Persistency judges against its threshold (tick + legend); Activity Ratio shows the current value only.
  const showThreshold = metricCode.startsWith('PERSISTENCY_');
  const tone = showThreshold && s.sentiment !== 'POSITIVE' ? 'var(--chart-danger)' : 'var(--chart-success)';
  return (
    <div className="dchart-chart">
      <div className="gauge-legend">
        <LegendItem colour={tone} label={t('insights.gaugeLegend.current')} value={`${pct}%`} />
        {showThreshold && <LegendItem colour="var(--chart-neutral)" label={t('insights.gaugeLegend.threshold')} value={`${s.threshold.value}%`} muted />}
      </div>
      <div className="ring-wrap">
        <RingGauge pct={pct} threshold={showThreshold ? s.threshold.value : undefined} tone={tone} label={`${pct}%`} desktop={desktop} />
      </div>
    </div>
  );
}
export function ThresholdArc({ s, metricCode }: { s: ThresholdGaugeSectionVM; metricCode: string }) {
  return <DetailChartCard chart={s} metricCode={metricCode} />;
}

/* ── w.metric-detail.bar-comparison — grouped (prior vs current) and stacked ─ */
const numOf = (v: BarComparisonSectionVM['measures'][number]['points'][number]['value']) => (v.kind === 'MONEY' ? Number(v.amount) : v.value);
const label2 = (v: BarComparisonSectionVM['measures'][number]['points'][number]['value']) =>
  v.kind === 'COUNT' && v.value >= 0 && v.value < 10 ? String(v.value).padStart(2, '0') : v.kind === 'MONEY' ? formatScalar(v).replace('RM ', '') : formatScalar(v);

/** Axis scale with headroom for the chip above the tallest bar: ≤ ~5 intervals on a 1-2-5 step. */
function niceScale(max: number, integers: boolean): { top: number; step: number } {
  const target = Math.max(max * 1.15, 1) / 5;
  const mag = 10 ** Math.floor(Math.log10(target));
  const steps = (integers ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]).map((m) => m * mag).filter((c) => !integers || c >= 1);
  const step = steps.find((c) => c >= target) ?? 10 * mag;
  return { top: Math.max(step, Math.ceil((max * 1.15) / step) * step), step };
}

/** Rounded top corners, flat bottom (Figma bars). */
const barPath = (x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, h, w / 2);
  return `M ${x} ${y + h} V ${y + rr} Q ${x} ${y} ${x + rr} ${y} H ${x + w - rr} Q ${x + w} ${y} ${x + w} ${y + rr} V ${y + h} Z`;
};

function BarsChart({ s }: { s: BarComparisonSectionVM }) {
  const stacked = s.layout === 'STACKED' && Boolean(s.totals);
  // Desktop (Figma 22:16535, 311×202 plot): axis labels at x12, gridlines 33→293, zero line at y159,
  // bars 106px apart about the plot centre, year labels 8px under the bars. Mobile keeps 1:15845.
  const desktop = useIsDesktop();
  const W = 311; const H = 202; const left = desktop ? 33 : 32; const plotW = 260; const baseY = desktop ? 159 : 160; const plotH = 120; const barW = 40;
  const peaks = stacked ? s.totals!.map((tt) => numOf(tt.value)) : s.measures.flatMap((m) => m.points.map((p) => numOf(p.value)));
  const integers = (s.measures[0]?.points[0]?.value.kind ?? 'COUNT') === 'COUNT';
  const { top, step } = niceScale(Math.max(...peaks, 1), integers);
  const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
  const yOf = (v: number) => baseY - (v / top) * plotH;
  // Slots are centred on the plot; the Figma frame sits the two bars slightly left of centre.
  const slotW = plotW / 2;
  const centre = (yi: number) => (desktop
    ? 151.5 + (yi - (s.years.length - 1) / 2) * 106
    : left + slotW * yi + slotW / 2 - 11);
  const yearY = baseY + (desktop ? 21 : 22); // text baseline (desktop: 16px box centred 16px under the bars)
  const lastYear = s.years[s.years.length - 1];
  return (
    <div className="dchart-chart">
      <div className="gauge-legend">
        {stacked
          ? s.measures.map((m, mi) => <LegendItem key={m.measureCode ?? mi} colour={mi === 0 ? 'var(--chart-bar-prior-soft)' : 'var(--chart-information)'} label={m.measureCode ? t(`insights.measure.${m.measureCode}`) : ''} />)
          : s.years.map((y) => <LegendItem key={y} colour={y === lastYear ? 'var(--chart-information)' : 'var(--chart-bar-prior-soft)'} label={String(y)} />)}
      </div>
      <svg className="bars-svg" width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={s.years.join(' / ')}>
        {ticks.map((tk) => (
          <g key={tk}>
            {/* desktop lines sit on the pixel below the tick (a 1px line centred in its 24px row) */}
            <line x1={left} x2={left + plotW} y1={yOf(tk) + (desktop ? 0.5 : 0)} y2={yOf(tk) + (desktop ? 0.5 : 0)} className={`chart-grid${tk === 0 ? ' zero' : ''}`} />
            <text x={desktop ? 12 : left - 8} y={yOf(tk) + (desktop ? 0.5 : 0)} textAnchor={desktop ? 'start' : 'end'} dominantBaseline="central" className="chart-axis">{tk}</text>
          </g>
        ))}
        {s.years.map((year, yi) => {
          const cx = centre(yi);
          const x = cx - barW / 2;
          const current = year === lastYear;
          if (stacked) {
            const total = s.totals!.find((tt) => tt.year === year);
            let y0 = baseY;
            const segs = s.measures.map((m, mi) => {
              const p = m.points.find((pt) => pt.year === year);
              if (!p) return null;
              const h = (numOf(p.value) / top) * plotH;
              y0 -= h;
              const first = mi === s.measures.length - 1; // top segment carries the rounded corners
              return (
                <g key={`${year}-${m.measureCode ?? mi}`}>
                  <path className="bar-seg" d={first ? barPath(x, y0, barW, h, 8) : `M ${x} ${y0} h ${barW} v ${h} h ${-barW} Z`} fill={mi === 0 ? 'var(--chart-bar-prior)' : 'var(--chart-information)'} />
                  {h >= 18 && <text x={cx} y={y0 + h / 2} textAnchor="middle" dominantBaseline="central" className="chart-bar-label" fill={mi === 0 ? 'var(--color-icon)' : 'var(--color-surface)'}>{label2(p.value)}</text>}
                </g>
              );
            });
            return (
              <g key={year}>
                {segs}
                {total && (
                  <g>
                    <rect x={cx - 15} y={y0 - 26} width="30" height="20" rx="4" fill="var(--color-badge-bg)" />
                    <text x={cx} y={y0 - 16} textAnchor="middle" dominantBaseline="central" className="chart-point">{label2(total.value)}</text>
                  </g>
                )}
                <text x={cx} y={yearY} textAnchor="middle" className="chart-year">{year}</text>
              </g>
            );
          }
          const point = s.measures[0]?.points.find((pt) => pt.year === year);
          if (!point) return null;
          const h = Math.max(6, (numOf(point.value) / top) * plotH);
          const y = baseY - h;
          // A bar too short to hold its label (zero / tiny values) carries the label above it instead.
          const labelAbove = h < 24;
          const chipY = desktop ? (labelAbove ? y - 46 : y - 24) : (labelAbove ? y - 48 : y - 26);
          const negative = point.change?.sentiment === 'NEGATIVE';
          const chipText = point.change ? formatDelta(point.change) : '';
          // Desktop chip is 4px/2px padding around the text (radius 6); mobile keeps the 32×20 chip.
          const chipW = desktop ? Math.round(chipText.length * 7.4 + 8) : 32;
          return (
            <g key={year}>
              <path className="bar-seg" d={barPath(x, y, barW, h, 8)} fill={current ? 'var(--chart-information)' : 'var(--chart-bar-prior)'} />
              <text x={cx} y={labelAbove ? y - 12 : y + (desktop ? 12 : 14)} textAnchor="middle" dominantBaseline="central" className={`chart-bar-label ${current ? 'current' : 'prior'}`} fill={labelAbove ? 'var(--color-icon)' : current ? 'var(--color-surface)' : 'var(--color-icon)'}>{label2(point.value)}</text>
              {point.change && (
                <g>
                  <rect x={cx - chipW / 2} y={chipY} width={chipW} height="20" rx={desktop ? 6 : 4} fill={negative ? 'var(--chart-danger-surface)' : 'var(--chart-success-surface)'} />
                  <text x={cx} y={chipY + 10} textAnchor="middle" dominantBaseline="central" className="chart-delta" fill={negative ? 'var(--chart-danger)' : 'var(--dd-text-success)'}>{chipText}</text>
                </g>
              )}
              <text x={cx} y={yearY} textAnchor="middle" className="chart-year">{year}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
export function BarComparison({ s, metricCode }: { s: BarComparisonSectionVM; metricCode: string }) {
  return <DetailChartCard chart={s} metricCode={metricCode} />;
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
      <div className={`yoy-row${deltaLine ? ' yoy-row-tall' : ''}`} style={deltaLine ? undefined : { marginTop: 8 }}>
        <span>
          <span className="k">{yearLabel(s.currentYear)}</span>
          <span className="sub">{t('insights.comparison.collected')}</span>
        </span>
        {deltaLine ? (
          <span className="yoy-value">
            <span className="v">{formatDetailScalar(s.current, metricCode)}</span>
            <DeltaLine delta={s.change} full />
          </span>
        ) : (
          <span className="v">{formatDetailScalar(s.current, metricCode)}</span>
        )}
      </div>
      {/* Figma 1:16160: the two year rows sit 12px apart with no hairline between them. */}
      {!deltaLine && <hr className="hairline" />}
      <div className="yoy-row">
        <span>
          <span className="k">{yearLabel(s.priorYear)}</span>
          <span className="sub">{t('insights.comparison.collected')}</span>
        </span>
        <span className={`v text-semibold${deltaLine ? ' subtle' : ''}`}>{formatDetailScalar(s.prior, metricCode)}</span>
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
    <div className={`card pad dd-card gauge-comparison${comparison ? '' : ' gauge-only'}${repricing ? ' gc-titled' : ''}`}>
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
export function VariantValueCard({ s, metricCode }: { s: VariantValueSectionVM; metricCode?: string }) {
  return (
    <div className="card pad dd-card dd-stack">
      {/* AC-P4-02-24: variant-only heading, bare year. Sentence case, 18/24 (Figma 1:16247). */}
      <div className="title14 dd-card-title">{t(`insights.detail.variantHeading.${s.variant}`)}</div>
      <div className="yoy-row">
        <span>
          <span className="k">{s.periodLabelYear}</span>
          <span className="sub">{t('insights.comparison.collected')}</span>
        </span>
        <span className="v">{formatDetailScalar(s.value, metricCode)}</span>
      </div>
    </div>
  );
}
/**
 * AC-P4-02-26: a single-row card — label left, value right.
 * AC-P4-02-56 (v1.19.0): with `linkFace` (TPC/PTPC) the COUNT value reads
 * "{count} Cases" with a trailing external-link glyph in link colour; other
 * metrics keep the bare count.
 * AC-P4-02-57: navigable only when the BFF supplies `nav` — it omits it while
 * the destination is open (OQ-30), so the value is then a plain span.
 */
export function PendersCard({ s, linkFace = false }: { s: PendersSectionVM; linkFace?: boolean }) {
  if (!linkFace || s.value.kind !== 'COUNT') {
    return (
      <div className="card pad dd-card penders-card">
        <div className="yoy-row">
          <span className="k">{t('insights.detail.penders')}</span>
          <span className="v">{formatScalar(s.value)}</span>
        </div>
      </div>
    );
  }
  const face = (
    <>
      {t('insights.detail.pendersCases', { count: formatScalar(s.value) })}
      <Icon token="open-in-new" size={16} tone="var(--dd-icon-info)" className="penders-icon" />
    </>
  );
  return (
    <div className="card pad dd-card penders-card">
      <div className="yoy-row">
        <span className="k">{t('insights.detail.penders')}</span>
        {s.nav ? (
          <Link to={href(s.nav)} className="penders-link">{face}</Link>
        ) : (
          <span className="penders-link">{face}</span>
        )}
      </div>
    </div>
  );
}

/* ── w.metric-detail.breakdown-table — Figma 1:16325 "Content Card" ──────────
 * One bordered card per variant: 14/20 Bold heading, then one row per product
 * (label left, plain value right, 1px hairline between rows) and a Total row
 * (14/20 Bold label, 16/24 Bold compact value). Rows stay a real <table> so
 * the screen-reader header and column semantics survive.
 */
/**
 * S-P4-02 v1.18.0: for the compact-money metrics, product rows show the plain
 * value (AC-P4-02-55) and only the Total is compact (AC-P4-02-54).
 * `heading` is the card title: the variant name for the repricing metrics
 * (TPC/PTPC, AC-P4-02-30), "Product wise {metric} distribution" otherwise.
 */
export function BreakdownTable({ s, metricCode, heading }: { s: BreakdownSectionVM; metricCode?: string; heading?: string }) {
  return (
    <div className="card pad dd-card dd-breakdown">
      {/* The shared "Breakdown by Product" heading lives once above the card(s), in MetricDetailMY. */}
      <div className="title14">{heading ?? t(`insights.variant.${s.variant}`)}</div>
      <div className="scroll-x">
        <table className="table">
          {/* AC-P4-02-62 (v1.21.0): header row is screen-reader only — the
              business line is shown visually by the Product context pill. */}
          <thead className="table-head-sr">
            <tr>
              <th className="colfirst"><span className="sr-only">{t('insights.detail.product')}</span></th>
              {s.columns.map((c) => (
                <th key={c} className="num colval">
                  <span className="sr-only">{t(`insights.detail.businessLine.${c}`)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {s.rows.map((r) => (
              <tr key={r.productCode}>
                {/* Figma 1:16325: only PSA and Single Premium read "(10%)"; "Credit Points" carries no suffix (closes OQ-72). */}
                <td className="colfirst">{t(`insights.product.${r.productCode}`)}{r.weightPct !== undefined && r.productCode !== 'CREDIT_POINTS' ? ` (${r.weightPct}%)` : ''}</td>
                {s.columns.map((c) => {
                  const cell = r.cells.find((x) => x.businessLine === c);
                  return <td key={c} className="num colval">{cell ? formatDetailScalar(cell.value, metricCode, 'row') : '-'}</td>;
                })}
              </tr>
            ))}
            <tr>
              <td className="colfirst total">{t('insights.detail.total')}</td>
              {s.columns.map((c) => {
                const tot = s.totals.find((x) => x.businessLine === c);
                return <td key={c} className="num colval total">{tot ? formatDetailScalar(tot.value, metricCode) : '-'}</td>;
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
