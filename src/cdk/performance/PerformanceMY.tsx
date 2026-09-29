/**
 * Malaysia Performance dashboard page (S-P4-01) — the LBU's own composition.
 * Owns page state + the lens; composes shared widgets from `@/components`,
 * the styled DLS skin from `@/dls-stub` and behaviour from `@/headless`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { t } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { apiFetch } from "@/lib/apiClient";
import {
  getPerformanceSample,
  initialPerformanceLens,
  PERFORMANCE_SAMPLES,
  type PerformanceLens,
} from "@/lib/performanceMock";
import type { PersonaId } from "@/lib/persona";
import { PerformanceSamplePicker } from "./parts/PerformanceSamplePicker";
import { ViewingBanner } from "./parts/ViewingBanner";
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
import CustomizeMetricsMY from "@/cdk/customize-metrics/CustomizeMetricsMY";
import type { CdkPageProps } from "@/cdk/types";
import type { PerformanceDashboardVM } from "@spec/performance-vm";

/** Rows intercepted at every breakpoint to open in place instead of
 * navigating (S-P4-01 v1.5.15, AC-P4-01-58; mobile renders the same surface
 * as a bottom sheet via `.cust-surface` media queries). */
const CUSTOMIZE_METRICS_ACTION_ID = new Set(["CUSTOMIZE_METRICS"]);

type LensState = PerformanceLens;

/** Last applied lens for this tab, so leaving the dashboard and coming back
 * (Back, a hard reload, a post-save redirect) keeps the user's filters.
 * Keyed by identity so a TEAM lens never leaks into an agent persona. */
const LENS_STORAGE_KEY = "pa_performance_lens";

function lensIdentity(persona: PersonaId): string {
  return `${persona}|${getPerformanceSample()?.id ?? ""}`;
}

function readStoredLens(persona: PersonaId): LensState | null {
  try {
    const raw = window.sessionStorage.getItem(LENS_STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as { identity?: unknown; lens?: Partial<LensState> };
    const l = stored.lens;
    if (stored.identity !== lensIdentity(persona) || !l
      || typeof l.scope !== "string" || typeof l.businessLine !== "string" || typeof l.basis !== "string") {
      return null;
    }
    return l as LensState;
  } catch {
    return null;
  }
}

function writeStoredLens(persona: PersonaId, lens: LensState | null): void {
  try {
    if (lens) {
      window.sessionStorage.setItem(LENS_STORAGE_KEY, JSON.stringify({ identity: lensIdentity(persona), lens }));
    } else {
      window.sessionStorage.removeItem(LENS_STORAGE_KEY);
    }
  } catch {
    /* storage unavailable (private mode) — filters just won't persist */
  }
}

export default function PerformanceMY({
  query,
  persona,
}: CdkPageProps["performance"]) {
  const initialToast = query.toast;
  /** S-P4-01 2.1.0 viewing mode: a leader viewing a downline member (AC-P4-01-82..83). */
  const subjectAgentId = query.subjectAgentId?.trim() || undefined;
  const [, setSearchParams] = useSearchParams();
  const [lens, setLens] = useState<LensState>(
    () => readStoredLens(persona) ?? initialPerformanceLens(),
  );
  const [vm, setVm] = useState<PerformanceDashboardVM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [toast, setToast] = useState<string | undefined>(
    initialToast ? t(initialToast) : undefined,
  );

  useEffect(() => {
    if (!initialToast) return;
    // Consume the one-shot ?toast= trigger so a later reload of this URL
    // doesn't replay it.
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("toast");
      return next;
    }, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const loadSeq = useRef(0);

  const load = useCallback(async (l: LensState) => {
    const seq = ++loadSeq.current;
    const params = new URLSearchParams({
      businessLine: l.businessLine,
      basis: l.basis,
      scope: l.scope,
    });
    if (l.period) params.set("period", l.period);
    if (l.scope === "TEAM" && l.teamView) params.set("teamView", l.teamView);
    if (subjectAgentId) params.set("subjectAgentId", subjectAgentId);
    const res = await apiFetch(`/api/bff/v1/performance/dashboard?${params}`);
    if (seq !== loadSeq.current) return;
    if (!res.ok) {
      // Drop a lens the BFF rejects so the next visit starts from defaults
      // (not in viewing mode: a rejected subject, e.g. 403, says nothing about the leader's own lens).
      if (!subjectAgentId) writeStoredLens(persona, null);
      setError(`${res.status}`);
      return;
    }
    const data: PerformanceDashboardVM = await res.json();
    const applied: LensState = {
      scope: data.filters.scope,
      period: data.filters.period,
      businessLine: data.filters.businessLine,
      basis: data.filters.basis,
      teamView: data.filters.teamView,
    };
    setError(null);
    setVm(data);
    setLens(applied);
    // Viewing mode shows a member's lens (scope follows their role); never persist it as the leader's own.
    if (!subjectAgentId) writeStoredLens(persona, applied);
  }, [persona, subjectAgentId]);

  useEffect(() => {
    setVm(null);
    void load(lens); /* initial, and again when entering/leaving viewing mode */
  }, [subjectAgentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetch = (patch: Partial<LensState>) => {
    const next = { ...lens, ...patch };
    if (patch.scope && patch.scope !== lens.scope) {
      // Reset on a real scope change, but retain the View sheet's explicit
      // Direct/Group choice in the same request (AC-P4-01-67).
      next.basis = "STANDARD";
      next.teamView = patch.scope === "TEAM" ? (patch.teamView ?? "DIRECT") : undefined;
      next.period = undefined; // pick up the scope's config default
    }
    if (next.scope === "SELF") next.teamView = undefined;
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
      {/* <div
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
      )} */}

      {vm.viewing ? (
        <ViewingBanner viewing={vm.viewing} />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
          className="section"
        >
          <h1>
            {t("insights.dashboard.title")}{" "}
            {f.scope === "TEAM" && f.teamView && (
              <span
                className="caption muted"
                style={{ fontWeight: 400, marginLeft: 6 }}
              >
                {t("insights.dashboard.teamViewSuffix", {
                  view: t(`insights.teamView.${f.teamView}`),
                })}
              </span>
            )}
          </h1>
          {vm.scopeSwitcher && (
            <ScopeSwitcher
              vm={vm.scopeSwitcher}
              teamView={f.teamView}
              onSelect={(scope, teamView) => refetch({ scope, ...(teamView ? { teamView } : {}) })}
            />
          )}
        </div>
      )}

      {/* Quick-link rail — 80×122 tiles (Figma 6588:16556) */}
      <div className="section">
        <QuickLinkRail
          links={vm.quickLinks}
          wide={Boolean(vm.viewing)}
          /* Temporary WIP gating, not a spec rule (S-P4-01 has no per-link
             disabled/clickable concept): their destination screens aren't
             built yet, so everything but TEAM_DRILLDOWN is disabled for now.
             Remove once those screens ship. */
          disabledIds={
            f.scope === "SELF"
              ? vm.quickLinks.map((link) => link.id)
              : vm.quickLinks.filter((link) => link.id !== "TEAM_DRILLDOWN").map((link) => link.id)
          }
        />
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
            interceptActionIds={CUSTOMIZE_METRICS_ACTION_ID}
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
              <MetricCard key={c.metricCode} vm={c} variant="priority" navigable={!vm.viewing} />
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
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Add focus metric"
                    onClick={() => setCustomizeOpen(true)}
                  >
                    <Icon token="add" size={21} tone="var(--color-text)" />
                  </button>
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
                    <MetricCard key={c.metricCode} vm={c} variant="simple" navigable={!vm.viewing} />
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

      {/* AI recommendations — sticky overlay pinned to the bottom of the
          screen (v1.5.5, was inline below the header); collapsed 44h bar
          by default (6588:16581) */}
      {/* {vm.recommendations.visible && vm.recommendations.panel && (
        <div className="reco-overlay">
          <RecoPanel vm={vm.recommendations.panel} />
        </div>
      )} */}

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
