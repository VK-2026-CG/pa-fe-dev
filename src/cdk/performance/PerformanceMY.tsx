/**
 * Malaysia Performance dashboard page (S-P4-01) — the LBU's own composition.
 * Owns page state + the lens; composes shared widgets from `@/components`,
 * the styled DLS skin from `@/dls-stub` and behaviour from `@/headless`.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { href } from '@/lib/nav';
import { apiFetch } from '@/lib/apiClient';
import { MetricCard, MilestoneCard } from '@/components/metrics';
import {
  FilterSheet, MoreActionsSheet, PeriodSheet, PersonaPicker, QuickLinkRail, RecoPanel, ScopeSwitcher, ToggleRow,
} from '@/components/chrome';
import { Toast } from '@/components/ui';
import {
  CarouselRow, FilterButton, Icon, IconButton, MetricPanel, PeriodButton, SectionTitleRow,
} from '@/dls-stub';
import { Tabs, useIsDesktop } from '@/headless';
import type { CdkPageProps } from '@/cdk/types';
import type { BusinessLine, PerformanceDashboardVM, PeriodType, Scope } from '@spec/performance-vm';

interface LensState {
  scope: Scope; period?: PeriodType; businessLine: string; basis: string; teamView?: string;
}

export default function PerformanceMY({ query, persona }: CdkPageProps['performance']) {
  const initialToast = query.toast;
  const [lens, setLens] = useState<LensState>({ scope: 'SELF', businessLine: 'ALL', basis: 'STANDARD' });
  const [vm, setVm] = useState<PerformanceDashboardVM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [toast, setToast] = useState<string | undefined>(initialToast ? t(initialToast) : undefined);
  const loadSeq = useRef(0);
  const isDesktop = useIsDesktop();

  const load = useCallback(async (l: LensState) => {
    const seq = ++loadSeq.current;
    const params = new URLSearchParams({ businessLine: l.businessLine, basis: l.basis, scope: l.scope });
    if (l.period) params.set('period', l.period);
    if (l.scope === 'TEAM' && l.teamView) params.set('teamView', l.teamView);
    const res = await apiFetch(`/api/bff/v1/performance/dashboard?${params}`);
    if (seq !== loadSeq.current) return;
    if (!res.ok) { setError(`${res.status}`); return; }
    const data: PerformanceDashboardVM = await res.json();
    setError(null);
    setVm(data);
    setLens({
      scope: data.filters.scope, period: data.filters.period, businessLine: data.filters.businessLine,
      basis: data.filters.basis, teamView: data.filters.teamView,
    });
  }, []);

  useEffect(() => { void load(lens); /* initial */ }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = (patch: Partial<LensState>) => {
    const next = { ...lens, ...patch };
    if (patch.scope) { // scope switch resets segment + teamView to defaults (AC-P4-01-14/15)
      next.basis = 'STANDARD';
      next.teamView = patch.scope === 'TEAM' ? 'DIRECT' : undefined;
      next.period = undefined; // pick up the scope's config default
    }
    setVm(null);
    setLens(next);
    void load(next);
  };

  if (error) return <div className="section card pad">Error {error}</div>;
  if (!vm) return <div className="section muted">Loading…</div>;

  const f = vm.filters;
  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(undefined)} />}
      <div className={`appbar dashboard-appbar ${vm.scopeSwitcher ? 'has-scope' : ''}`}>
        <h1>Performance</h1>
        {vm.scopeSwitcher && <ScopeSwitcher vm={vm.scopeSwitcher} onSelect={(scope) => refetch({ scope })} />}
        <Link className="contest-admin-link" to="/contest-admin/contests">{t("insights.nav.contestAdmin")}</Link>
        <PersonaPicker current={persona} />
      </div>

      {/* Quick-link rail — 80×122 tiles (Figma 6588:16556) */}
      <div className="section"><QuickLinkRail links={vm.quickLinks} /></div>

      {!isDesktop ? (
        /* Section title row 343×24 with trailing 12px link (6588:16578) */
        <div className="section">
          <SectionTitleRow
            title={t('insights.dashboard.metricTracking')}
            trailing={
              <Link className="link12" to={href({ route: 'insights/customize-metrics' })}>
                {t('insights.action.CUSTOMIZE_METRICS.title')}
              </Link>
            }
          />
        </div>
      ) : (
        /* Desktop header: title + unified Filter + more-actions, plus read-only
           summary pills (A7, v1.4.0 screenshot-derived) — replaces the mobile
           period-btn/tabs/toggle rows below with one combined Filter sheet. */
        <>
          <div className="section spread">
            <span className="title16">{t('insights.dashboard.metricTracking')}</span>
            <span className="row" style={{ gap: 4 }}>
              <FilterButton label={t('insights.action.FILTER')} onClick={() => setFilterOpen(true)} />
              <IconButton token="more-horiz" label="More actions" onClick={() => setMoreOpen(true)} />
            </span>
          </div>
          <div className="section">
            <div className="filter-row">
              <button className="pill" onClick={() => setFilterOpen(true)}>
                <span className="muted">{t('insights.dashboard.filter.product')}</span> {t(`insights.businessLine.${f.businessLine}`)}
              </button>
              <button className="pill" onClick={() => setFilterOpen(true)}>
                <span className="muted">{t('insights.dashboard.filter.time')}</span> {t(`insights.period.${f.period}`)}
              </button>
            </div>
          </div>
        </>
      )}

      {/* AI recommendations — collapsed 44h bar by default (6588:16581) */}
      {vm.recommendations.visible && vm.recommendations.panel && (
        <div className="section"><RecoPanel vm={vm.recommendations.panel} /></div>
      )}

      {!isDesktop && (
        <>
          {/* Priority header: title 14/20 + period Button + more-horiz (6588:16637) */}
          <div className="section spread">
            <span className="title14">{t('insights.dashboard.priorityMetrics', { n: vm.priorityMetrics.length })}</span>
            <span className="row" style={{ gap: 4 }}>
              <PeriodButton label={t(`insights.period.${f.period}`)} onClick={() => setSheetOpen(true)} />
              <IconButton token="more-horiz" label="More actions" onClick={() => setMoreOpen(true)} />
            </span>
          </div>

          {/* Business line segmented tabs (config-driven) */}
          <div className="section">
            <Tabs<BusinessLine>
              value={f.businessLine} options={f.businessLineOptions} className="segtabs"
              onChange={(bl) => refetch({ businessLine: bl })}
              renderTab={(bl, selected) => (
                <span className={`seg ${selected ? 'active' : ''}`} style={{ display: 'block' }}>
                  {t(`insights.businessLine.${bl}`)}
                </span>
              )}
            />
          </div>

          {/* Scheme / Group toggle rows 343×40 (Switch-B, 6588:16670) */}
          {(f.basisToggleVisible || f.teamViewToggleVisible) && (
            <div className="section" style={{ marginTop: 4, marginBottom: 4 }}>
              {f.basisToggleVisible && (
                <ToggleRow label={t('insights.basis.SCHEME.toggle')} on={f.basis === 'SCHEME'}
                  onChange={(on) => refetch({ basis: on ? 'SCHEME' : 'STANDARD' })} />
              )}
              {f.teamViewToggleVisible && (
                <ToggleRow label={t('insights.teamView.toggle')} on={f.teamView === 'GROUP'}
                  onChange={(on) => refetch({ teamView: on ? 'GROUP' : 'DIRECT' })} />
              )}
            </div>
          )}
        </>
      )}

      {/* PRIORITY METRICS — carousel of 308×166 cards (6588:17629), grid at ≥1024px inside a panel (A7) */}
      <div className="section">
        <MetricPanel isDesktop={isDesktop} title={t('insights.dashboard.priorityMetrics.panelTitle')} count={vm.priorityMetrics.length}>
          <CarouselRow count={vm.priorityMetrics.length} className="metric-grid" showDots={!isDesktop}>
            {vm.priorityMetrics.map((c) => <MetricCard key={c.metricCode} vm={c} variant="priority" />)}
          </CarouselRow>
        </MetricPanel>
      </div>

      {/* OTHER FOCUS — carousel of 280×80 simple cards. Header stays visible even when empty
          (AC-P4-01-26/27, v1.4.0): shows a "+" add affordance instead of hiding the section. */}
      {vm.focusMetrics.visible && (
        <>
          {!isDesktop && (
            <div className="section spread">
              <div className="section-label">{t('insights.dashboard.otherFocusMetrics', { n: vm.focusMetrics.items.length })}</div>
              {vm.focusMetrics.items.length === 0 && vm.focusMetrics.addEnabled && (
                <Link className="icon-btn" aria-label="Add focus metric" to={href({ route: 'insights/customize-metrics' })}>
                  <Icon token="add" size={21} tone="var(--color-text)" />
                </Link>
              )}
            </div>
          )}
          <div className="section">
            <MetricPanel
              isDesktop={isDesktop}
              title={t('insights.dashboard.otherFocusMetrics.panelTitle')}
              count={vm.focusMetrics.items.length}
              action={vm.focusMetrics.items.length === 0 && vm.focusMetrics.addEnabled ? (
                <Link className="icon-btn" aria-label="Add focus metric" to={href({ route: 'insights/customize-metrics' })}>
                  <Icon token="add" size={21} tone="var(--color-text)" />
                </Link>
              ) : undefined}
            >
              {vm.focusMetrics.items.length > 0 && (
                <CarouselRow count={vm.focusMetrics.items.length} showDots={false} className="metric-grid" style={{ marginTop: 8 }}>
                  {vm.focusMetrics.items.map((c) => <MetricCard key={c.metricCode} vm={c} variant="simple" />)}
                </CarouselRow>
              )}
            </MetricPanel>
          </div>
        </>
      )}

      {/* PRIORITY MILESTONES — header + add (6588:16764) + 308×238 carousel */}
      {vm.milestones.visible && (
        <>
          <div className="section spread">
            <span className="title14">{t('insights.dashboard.priorityMilestones')}</span>
            <span className="row" style={{ gap: 4 }}>
              {vm.milestones.setGoalEnabled && (
                <Link className="link12" to="/insights/placeholder?screen=set-goals">
                  {t('insights.milestone.setGoal')}
                </Link>
              )}
              {vm.milestones.addEnabled && (
                <Link className="icon-btn" aria-label="Add milestone" to={href({ route: 'insights/milestones' })}>
                  <Icon token="add" size={21} tone="var(--color-text)" />
                </Link>
              )}
            </span>
          </div>
          <div className="section" style={{ marginTop: 8 }}>
            <CarouselRow count={vm.milestones.items.length}>
              {vm.milestones.items.map((m) => <MilestoneCard key={m.programCode} vm={m} />)}
            </CarouselRow>
          </div>
        </>
      )}

      {/* Footer link row 343×52 (6588:17798) */}
      {vm.footerLinks.map((l) => (
        <div className="section" key={l.id}>
          <Link className="footer-link" to={href(l.nav)}>
            <Icon token="quick.VIEW_MOC" size={20} tone="var(--color-brand)" />
            <span style={{ flex: 1 }}>{t('insights.dashboard.viewMoc')}</span>
            <Icon token="arrow-right-s" size={20} tone="var(--color-text-muted)" />
          </Link>
        </div>
      ))}

      {sheetOpen && (
        <PeriodSheet
          value={f.period} options={f.periodOptions} meta={f.periodOptionsMeta}
          onClose={() => setSheetOpen(false)}
          onSelect={(p) => refetch({ period: p })}
        />
      )}
      {moreOpen && <MoreActionsSheet actions={vm.moreActions} onClose={() => setMoreOpen(false)} />}
      {filterOpen && (
        <FilterSheet f={f} onApply={(patch) => refetch(patch)} onClose={() => setFilterOpen(false)} />
      )}
    </>
  );
}
