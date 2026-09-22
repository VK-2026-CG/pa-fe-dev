/**
 * Malaysia Performance dashboard page (S-P4-01) — the LBU's own composition.
 * Owns page state + the lens; composes shared widgets from `@/components`,
 * the styled DLS skin from `@/dls-stub` and behaviour from `@/headless`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { t } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { apiFetch } from "@/lib/apiClient";
import {
  initialPerformanceLens,
  PERFORMANCE_SAMPLES,
  type PerformanceLens,
} from "@/lib/performanceMock";
import { PerformanceSamplePicker } from "./parts/PerformanceSamplePicker";
import { MetricCard, MilestoneCard } from "@/components/metrics";
import {
  ContextPill,
  FilterSheet,
  MoreActionsControl,
  PersonaPicker,
  QuickLinkRail,
  RecoPanel,
  ScopeSwitcher,
} from "@/components/chrome";
import { Toast } from "@/components/ui";
import { CarouselRow, FilterButton, Icon, MetricPanel } from "@/dls-stub";
import { useIsTabletUp } from "@/headless";
import CustomizeMetricsMY from "@/cdk/customize-metrics/CustomizeMetricsMY";
import type { CdkPageProps } from "@/cdk/types";
import type { PerformanceDashboardVM } from "@spec/performance-vm";

/** Rows intercepted at breakpoint.tablet/desktop to open in place instead of
 * navigating (S-P4-01 v1.5.15, AC-P4-01-58). */
const CUSTOMIZE_METRICS_ACTION_ID = new Set(["CUSTOMIZE_METRICS"]);

type LensState = PerformanceLens;

export default function PerformanceMY({
  query,
  persona,
}: CdkPageProps["performance"]) {
  const initialToast = query.toast;
  const [lens, setLens] = useState<LensState>(() => initialPerformanceLens());
  const [vm, setVm] = useState<PerformanceDashboardVM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [toast, setToast] = useState<string | undefined>(
    initialToast ? t(initialToast) : undefined,
  );
  const loadSeq = useRef(0);
  /** breakpoint.tablet/desktop opens Customize Metrics in place; mobile still
   * navigates to the standalone route (S-P4-04 v1.5.0, AC-P4-04-33/37). */
  const isTabletUp = useIsTabletUp();

  const load = useCallback(async (l: LensState) => {
    const seq = ++loadSeq.current;
    const params = new URLSearchParams({
      businessLine: l.businessLine,
      basis: l.basis,
      scope: l.scope,
    });
    if (l.period) params.set("period", l.period);
    if (l.scope === "TEAM" && l.teamView) params.set("teamView", l.teamView);
    const res = await apiFetch(`/api/bff/v1/performance/dashboard?${params}`);
    if (seq !== loadSeq.current) return;
    if (!res.ok) {
      setError(`${res.status}`);
      return;
    }
    const data: PerformanceDashboardVM = await res.json();
    setError(null);
    setVm(data);
    setLens({
      scope: data.filters.scope,
      period: data.filters.period,
      businessLine: data.filters.businessLine,
      basis: data.filters.basis,
      teamView: data.filters.teamView,
    });
  }, []);

  useEffect(() => {
    void load(lens); /* initial */
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = (patch: Partial<LensState>) => {
    const next = { ...lens, ...patch };
    if (patch.scope) {
      // scope switch resets segment + teamView to defaults (AC-P4-01-14/15)
      next.basis = "STANDARD";
      next.teamView = patch.scope === "TEAM" ? "DIRECT" : undefined;
      next.period = undefined; // pick up the scope's config default
    }
    setVm(null);
    setLens(next);
    void load(next);
  };

  if (error)
    return (
      <>
        <PerformanceSamplePicker />
        <div className="section card pad">Error {error}</div>
      </>
    );
  if (!vm) return <div className="section muted">Loading…</div>;

  const f = vm.filters;
  return (
    <>
      {toast && <Toast message={toast} onDone={() => setToast(undefined)} />}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 20,
        }}
        className={`appbar dashboard-appbar ${vm.scopeSwitcher ? "has-scope" : ""}`}
      >
        <Link className="contest-admin-link" to="/contest-admin/contests">
          {t("insights.nav.contestAdmin")}
        </Link>
        {PERFORMANCE_SAMPLES.length ? (
          <PerformanceSamplePicker />
        ) : (
          <PersonaPicker current={persona} />
        )}
      </div>

      {PERFORMANCE_SAMPLES.length > 0 && (
        <div className="section muted">{t("insights.dev.sample.notice")}</div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="section"
      >
        <h1>Performance</h1>
        {vm.scopeSwitcher && (
          <ScopeSwitcher
            vm={vm.scopeSwitcher}
            onSelect={(scope) => refetch({ scope })}
          />
        )}
      </div>

      {/* Quick-link rail — 80×122 tiles (Figma 6588:16556) */}
      <div className="section">
        <QuickLinkRail links={vm.quickLinks} />
      </div>

      {/* Header: title + unified Filter + more-actions, plus read-only summary
          pills (A7/v1.5.6 — unified across every breakpoint; this used to be
          desktop-only, with mobile showing a separate title+link row plus a
          period button/business-line tabs/toggle rows further down). */}
      <div className="section spread">
        <span className="title16">
          {t("insights.dashboard.metricTracking")}
        </span>
        <span className="row" style={{ gap: 4 }}>
          <FilterButton
            label={t("insights.action.FILTER")}
            onClick={() => setFilterOpen(true)}
          />
          <MoreActionsControl
            actions={vm.moreActions}
            interceptActionIds={
              isTabletUp ? CUSTOMIZE_METRICS_ACTION_ID : undefined
            }
            onIntercept={() => setCustomizeOpen(true)}
          />
        </span>
      </div>
      {/* Product/Time read-only summary pills (AC-P4-01-38) — static labels,
          not controls, and intentionally rendered with their own dedicated
          class so the History screen's pills remain unchanged. */}
      <div className="section">
        <div className="filter-row">
          <ContextPill
            labelKey="insights.dashboard.filter.product"
            value={t(`insights.businessLine.${f.businessLine}`)}
          />
          <ContextPill
            labelKey="insights.dashboard.filter.time"
            value={t(`insights.period.${f.period}`)}
          />
        </div>
      </div>

      {/* PRIORITY METRICS — static single-column list below breakpoint.desktop
          (<1024px, mobile and tablet alike), 2-column grid at ≥1024px inside
          a panel (AC-P4-01-43, v1.5.10, amends A7). No horizontal scroll or
          pagination dots at any breakpoint. Other Focus Metrics below now
          matches this layout too (AC-P4-01-47, v1.5.12), via its own
          independent `.focus-grid` class. Collapsible panel header
          (title + count) renders at every breakpoint (v1.5.6). */}
      <div className="section">
        <MetricPanel
          isDesktop={true}
          title={t("insights.dashboard.priorityMetrics.panelTitle")}
          count={vm.priorityMetrics.length}
        >
          <CarouselRow
            count={vm.priorityMetrics.length}
            className="priority-grid"
            showDots={false}
          >
            {vm.priorityMetrics.map((c) => (
              <MetricCard key={c.metricCode} vm={c} variant="priority" />
            ))}
          </CarouselRow>
        </MetricPanel>
      </div>

      {/* OTHER FOCUS — 280×80 simple cards; static single-column list below
          breakpoint.desktop, 2-column grid at ≥1024px (AC-P4-01-47, v1.5.12,
          matches Priority Metrics' AC-P4-01-43 via its own `.focus-grid`
          class). Header stays visible even when empty (AC-P4-01-26/27,
          v1.4.0): shows a "+" add affordance instead of hiding the section.
          Collapsible panel header now renders at every breakpoint (v1.5.6). */}
      {vm.focusMetrics.visible && (
        <>
          <div className="section">
            <MetricPanel
              isDesktop={true}
              title={t("insights.dashboard.otherFocusMetrics.panelTitle")}
              count={vm.focusMetrics.items.length}
              action={
                vm.focusMetrics.items.length === 0 &&
                vm.focusMetrics.addEnabled ? (
                  isTabletUp ? (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Add focus metric"
                      onClick={() => setCustomizeOpen(true)}
                    >
                      <Icon token="add" size={21} tone="var(--color-text)" />
                    </button>
                  ) : (
                    <Link
                      className="icon-btn"
                      aria-label="Add focus metric"
                      to={href({ route: "insights/customize-metrics" })}
                    >
                      <Icon token="add" size={21} tone="var(--color-text)" />
                    </Link>
                  )
                ) : undefined
              }
            >
              {vm.focusMetrics.items.length > 0 && (
                <CarouselRow
                  count={vm.focusMetrics.items.length}
                  showDots={false}
                  className="focus-grid"
                  style={{ marginTop: 8 }}
                >
                  {vm.focusMetrics.items.map((c) => (
                    <MetricCard key={c.metricCode} vm={c} variant="simple" />
                  ))}
                </CarouselRow>
              )}
            </MetricPanel>
          </div>
        </>
      )}

      {/* PRIORITY MILESTONES — header + add (6588:16764) + 308×238 carousel */}
      {!vm.milestones.visible && (
        <>
          <div className="section spread">
            <span className="title14">
              {t("insights.dashboard.priorityMilestones")}
            </span>
            <span className="row" style={{ gap: 4 }}>
              {vm.milestones.setGoalEnabled && (
                <Link
                  className="link12"
                  to="/insights/placeholder?screen=set-goals"
                >
                  {t("insights.milestone.setGoal")}
                </Link>
              )}
              {vm.milestones.addEnabled && (
                <Link
                  className="icon-btn"
                  aria-label="Add milestone"
                  to={href({ route: "insights/milestones" })}
                >
                  <Icon token="add" size={21} tone="var(--color-text)" />
                </Link>
              )}
            </span>
          </div>
          <div className="section" style={{ marginTop: 8 }}>
            <CarouselRow count={vm.milestones.items.length}>
              {vm.milestones.items.map((m) => (
                <MilestoneCard key={m.programCode} vm={m} />
              ))}
            </CarouselRow>
          </div>
        </>
      )}

      {/* Footer link row 343×52 (6588:17798) */}
      {vm.footerLinks.map((l) => (
        <div className="section" key={l.id}>
          <Link className="footer-link" to={href(l.nav)}>
            <Icon token="quick.VIEW_MOC" size={20} tone="var(--color-brand)" />
            <span style={{ flex: 1 }}>{t("insights.dashboard.viewMoc")}</span>
            <Icon
              token="arrow-right-s"
              size={20}
              tone="var(--color-text-muted)"
            />
          </Link>
        </div>
      ))}

      {/* AI recommendations — sticky overlay pinned to the bottom of the
          screen (v1.5.5, was inline below the header); collapsed 44h bar
          by default (6588:16581) */}
      {vm.recommendations.visible && vm.recommendations.panel && (
        <div className="reco-overlay">
          <RecoPanel vm={vm.recommendations.panel} />
        </div>
      )}

      {filterOpen && (
        <FilterSheet
          f={f}
          onApply={(patch) => refetch(patch)}
          onClose={() => setFilterOpen(false)}
        />
      )}
      {customizeOpen && (
        <CustomizeMetricsMY
          query={{ scope: f.scope }}
          onClose={() => setCustomizeOpen(false)}
          onSaved={() => {
            setCustomizeOpen(false);
            setToast(t("insights.toast.focusMetricsAdded"));
            void load(lens);
          }}
        />
      )}
    </>
  );
}
