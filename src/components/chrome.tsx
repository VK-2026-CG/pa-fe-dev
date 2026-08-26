'use client';
import Link from 'next/link';
import { useState } from 'react';
import { t } from '@/lib/i18n';
import { href } from '@/lib/nav';
import { formatScalar } from '@/lib/format';
import { PERSONAS, type PersonaId } from '@/lib/persona';
import { Collapse, clampPct } from '@/headless';
import {
  BottomSheet, Icon, IconButton, ProgressBar, RadioSheetList, ScopePill, SheetRow,
} from '@/dls-stub';
import type {
  MoreActionVM, PeriodType, QuickLinkVM, RecommendationsPanelVM, Scope, ScopeSwitcherVM,
} from '@spec/performance-vm';

/* ── w.quick-links (tiles 80×122, icon 62, per Figma 6588:16556) ───────── */
export function QuickLinkRail({ links }: { links: QuickLinkVM[] }) {
  return (
    <nav className="quick" aria-label="Quick links">
      {links.map((l) => (
        <Link key={l.id} href={href(l.nav)}>
          <span className="ic"><Icon token={`quick.${l.id}`} size={26} tone="var(--color-brand)" /></span>
          <span className="lbl">{t(`insights.quicklink.${l.id}`)}</span>
        </Link>
      ))}
    </nav>
  );
}

/* ── Period bottom sheet (rows 52h + radio; Select CTA) ────────────────── */
export function PeriodSheet({ value, options, meta, onSelect, onClose }: {
  value: PeriodType; options: PeriodType[];
  meta?: Array<{ period: PeriodType; startDate: string }>;
  onSelect: (p: PeriodType) => void; onClose: () => void;
}) {
  const [sel, setSel] = useState<PeriodType>(value);
  const sub = (p: PeriodType) => {
    const m = meta?.find((x) => x.period === p);
    if (!m) return undefined;
    const d = new Date(`${m.startDate}T00:00:00Z`);
    const start = `${d.getUTCDate()} ${d.toLocaleString('en', { month: 'short', timeZone: 'UTC' })} ${d.getUTCFullYear()}`;
    return t('insights.period.range', { start });
  };
  return (
    <BottomSheet title={t('insights.period.sheetTitle')} onClose={onClose}>
      <RadioSheetList value={sel} options={options} onChange={setSel}
        label={(p) => t(`insights.period.${p}`)} sub={sub} />
      <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => { onSelect(sel); onClose(); }}>
        {t('insights.common.select')}
      </button>
    </BottomSheet>
  );
}

/* ── More actions — bottom sheet (Figma 6588:16896: rows 52h, lead icons) ─ */
export function MoreActionsSheet({ actions, onClose }: { actions: MoreActionVM[]; onClose: () => void }) {
  return (
    <BottomSheet title={t('insights.dashboard.metricTracking')} onClose={onClose}>
      {actions.map((a) => (
        <Link key={a.id} href={href(a.nav)} onClick={onClose} style={{ display: 'block' }}>
          <SheetRow leadToken={`sheet.${a.id}`} label={t(`insights.action.${a.id}.title`)} />
        </Link>
      ))}
    </BottomSheet>
  );
}

/* ── Scheme / Group toggle row is styled by dls-stub ToggleRow ─────────── */
export { ToggleRow } from '@/dls-stub';

/* ── Scope switcher pill (108×38, Figma 6588:16960) ────────────────────── */
export function ScopeSwitcher({ vm, onSelect }: { vm: ScopeSwitcherVM; onSelect: (s: Scope) => void }) {
  return (
    <ScopePill
      label={t(`insights.scope.${vm.current}`)}
      options={vm.options.map((o) => ({ key: o.scope, label: t(`insights.scope.${o.scope}`), selected: o.scope === vm.current }))}
      onSelect={(k) => onSelect(k as Scope)}
    />
  );
}

export function PersonaPicker({ current }: { current?: string }) {
  return (
    <span className="persona">
      <select
        aria-label="Dev persona"
        defaultValue={current}
        onChange={async (e) => {
          await fetch('/api/dev/persona', {
            method: 'POST', headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ persona: e.target.value as PersonaId }),
          });
          location.href = '/insights/performance';
        }}
      >
        {PERSONAS.map((p) => (
          <option key={p.id} value={p.id} title={p.label}>
            {p.id.slice(p.id.lastIndexOf('_') + 1)}
          </option>
        ))}
      </select>
    </span>
  );
}

/* ── w.reco — collapsed gradient bar 44h (default) + expanded panel ─────
   Figma Component 2 (6588:16581): bar = sparkle 16 + title 14/20 + chevron
   18; body 299h pad 16: flags 311×50, highlight, insight rows, CTA, footer
   strip (refresh + generatedAt + thumbs). Collapsed is the default state. */
export function RecoPanel({ vm, expandedInitial = false }: { vm: RecommendationsPanelVM; expandedInitial?: boolean }) {
  const [feedback, setFeedback] = useState(vm.feedback);
  const [busy, setBusy] = useState(false);
  const sendFeedback = async (rating: 'UP' | 'DOWN') => {
    if (busy) return;
    const prev = feedback;
    setFeedback(rating); setBusy(true);
    try {
      const res = await fetch('/api/insights/recommendations/feedback', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ recommendationId: vm.recommendationId, rating }),
      });
      if (!res.ok) setFeedback(prev);
    } catch { setFeedback(prev); } finally { setBusy(false); }
  };
  const generated = new Date(vm.generatedAt);
  const genText = t('insights.reco.generatedAt', {
    date: generated.toISOString().slice(0, 10),
    time: `${String(generated.getUTCHours()).padStart(2, '0')}:${String(generated.getUTCMinutes()).padStart(2, '0')}`,
  });
  return (
    <Collapse defaultOpen={expandedInitial}
      trigger={({ open, toggle, buttonProps }) => (
        <button {...buttonProps} className={`reco-bar ${open ? 'open' : ''}`} onClick={toggle}>
          <Icon token="sparkle" size={16} tone="#fff" />
          <span style={{ flex: 1, textAlign: 'left' }}>{t('insights.reco.banner')}</span>
          <Icon token={open ? 'arrow-up-s' : 'arrow-down-s'} size={18} tone="#fff" />
        </button>
      )}>
      <div className="reco-panel">
        {vm.flags.length > 0 && (
          <div>
            {vm.flags.map((f) => (
              <div key={f.code} className="spread" style={{ minHeight: 24 }}>
                <span className="title14">{t(`insights.reco.flag.${f.code}`)}</span>
                <span aria-hidden>{f.severity === 'CRITICAL' ? '🚨' : f.severity === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
              </div>
            ))}
          </div>
        )}
        {vm.highlight && (
          <div style={{ marginTop: 10 }}>
            <div className="spread">
              <span className="title14">
                {t('insights.reco.secured', {
                  value: formatScalar(vm.highlight.achieved),
                  metric: t(`insights.metric.${vm.highlight.metricCode}.title`),
                })}
              </span>
              {vm.highlight.goal?.state === 'SET' && vm.highlight.goal.target && (
                <span className="caption muted">
                  {t('insights.reco.goalLine', {
                    goal: formatScalar(vm.highlight.goal.target),
                    pct: String(Math.round(vm.highlight.goal.progressPct ?? 0)),
                  })}
                </span>
              )}
            </div>
            {vm.highlight.goal?.state === 'SET' && <ProgressBar pct={clampPct(vm.highlight.goal.progressPct)} brand />}
            {vm.highlight.runRateDeltaPct !== undefined && (
              <div className="caption" style={{ marginTop: 6, color: vm.highlight.runRateDeltaPct >= 0 ? 'var(--tone-success)' : 'var(--tone-danger)' }}>
                {t(vm.highlight.runRateDeltaPct >= 0 ? 'insights.reco.runRateAbove' : 'insights.reco.runRateBelow',
                  { pct: String(Math.abs(vm.highlight.runRateDeltaPct)) })}
              </div>
            )}
          </div>
        )}
        {vm.insights.map((i) => {
          const body = (
            <span className="spread">
              <span>
                <span className="title14">{t(`insights.reco.insight.${i.titleCode}`)}</span>
                {i.trend && (
                  <span className="caption" style={{ display: 'flex', alignItems: 'center', gap: 4, color: i.trend.sentiment === 'NEGATIVE' ? 'var(--tone-danger)' : 'var(--tone-success)' }}>
                    <Icon token="arrow-upward" size={12} tone="currentColor"
                      style={i.trend.direction === 'DOWN' ? { transform: 'rotate(180deg)' } : undefined} />
                    {i.trend.text}
                  </span>
                )}
                {i.narrative && <span className="caption muted" style={{ display: 'block', marginTop: 4 }}>{i.narrative}</span>}
              </span>
              {i.nav && <Icon token="arrow-right-s" size={20} tone="var(--color-text-muted)" />}
            </span>
          );
          return i.nav
            ? <Link key={i.code} href={href(i.nav)} className="reco-insight">{body}</Link>
            : <div key={i.code} className="reco-insight">{body}</div>;
        })}
        {vm.cta && (
          <Link href={href(vm.cta.nav)} className="spread text-semibold" style={{ marginTop: 12 }}>
            <span className="row"><span style={{ width: 8, height: 8, borderRadius: 4, background: 'var(--color-brand)' }} />{t('insights.reco.viewTeamDrilldown')}</span>
            <Icon token="arrow-right-s" size={20} tone="var(--color-text-muted)" />
          </Link>
        )}
        <div className="reco-footer">
          <span className="row caption muted"><Icon token="refresh" size={16} tone="var(--color-text-muted)" />{genText}</span>
          <span className="row" style={{ gap: 4 }}>
            <IconButton token="thumb-up" label="Helpful" size={18} onClick={() => sendFeedback('UP')} />
            <IconButton token="thumb-down" label="Not helpful" size={18} onClick={() => sendFeedback('DOWN')} />
          </span>
        </div>
        {feedback && <div className="caption muted" style={{ marginTop: 6, textAlign: 'right' }}>{feedback === 'UP' ? '👍' : '👎'}</div>}
      </div>
    </Collapse>
  );
}
