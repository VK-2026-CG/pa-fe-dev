import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { formatScalar } from "@/lib/format";
import { PERSONAS, type PersonaId } from "@/lib/persona";
import { usePersona } from "@/lib/usePersona";
import { apiFetch } from "@/lib/apiClient";
import { Collapse, clampPct, useIsTabletUp } from "@/headless";
import {
  BottomSheet,
  Icon,
  IconButton,
  MenuPopover,
  ProgressBar,
  RadioDropdown,
  RadioSheetList,
  ScopePill,
  SheetRow,
  ToggleRow,
} from "@/dls-stub";
import type {
  Basis,
  BusinessLine,
  DashboardFiltersVM,
  MoreActionVM,
  PeriodType,
  QuickLinkVM,
  RecommendationsPanelVM,
  Scope,
  ScopeSwitcherVM,
  TeamView,
} from "@spec/performance-vm";

/**
 * w.detail.context-pill — read-only pill pairing a muted label with its
 * value ("Product Both", "Time YTD"). Shared by the S-P4-01 dashboard
 * (AC-P4-01-38/48/51) and S-P4-02's header region (AC-P4-02-22); promoted
 * out of PerformanceMY when the second consumer appeared. Static label, not
 * a control.
 */
export function ContextPill({
  labelKey,
  value,
  onClick,
  className,
}: {
  labelKey: string;
  value: string;
  /** S-P4-07 0.2.0: the My Team filter/sort chips open the Filters sheet. Absent ⇒ static label. */
  onClick?: () => void;
  className?: string;
}) {
  const content = (
    <>
      <span className="muted ctx-pill-label">{t(labelKey)}</span>
      {value}
    </>
  );
  const cls = `filter-pill ${className ?? ""}`.trim();
  return onClick ? (
    <button type="button" className={cls} aria-label={`${t(labelKey)}: ${value}`} onClick={onClick}>
      {content}
    </button>
  ) : (
    <span className={cls} aria-label={`${t(labelKey)}: ${value}`}>
      {content}
    </span>
  );
}

/**
 * Tile glyphs that are Figma exports (Top Navigation, frame 1:4931): drawn as
 * plain images at their native size — the SVGs carry their own #ED1B2D fill, so
 * no mask tint and no stretching (they use preserveAspectRatio="none").
 */
const FIGMA_QUICK_ICON: Record<string, { w: number; h: number }> = {
  MILESTONES: { w: 25, h: 22 },
  TEAM_DRILLDOWN: { w: 25, h: 24 },
  COMP_BEN: { w: 36, h: 36 },
  LEADERBOARD: { w: 28, h: 28 },
};

/* ── w.quick-links (tiles 80×122, icon 62, per Figma 6588:16556) ───────── */
export function QuickLinkRail({
  links,
  wide,
  disabledIds = [],
}: {
  links: QuickLinkVM[];
  /** S-P4-01 2.1.0 viewing mode: wide tiles, icon + label inline (AC-P4-01-85). */
  wide?: boolean;
  disabledIds?: string[];
}) {
  return (
    <nav className={`quick ${wide ? "quick-wide" : ""}`.trim()} aria-label="Quick links">
      {links.map((l) => {
        const disabled = disabledIds.includes(l.id);
        // Viewing mode's wide tiles keep a 26px icon box, so they stay on the tinted 26px mask.
        // The wide tile is the Figma card (32:15280 / 32:19555) with the untinted 36px glyph.
        const figma = FIGMA_QUICK_ICON[l.id];
        const content = (
          <>
            <span className="ic">
              {figma ? (
                <Icon token={`quick.${l.id}`} size={figma.w} height={figma.h} />
              ) : (
                <Icon token={`quick.${l.id}`} size={26} tone="var(--color-brand)" />
              )}
            </span>
            <span className="lbl">{t(`insights.quicklink.${l.id}`)}</span>
          </>
        );

        return (
          <Link
            key={l.id}
            to={disabled ? "#" : href(l.nav)}
            aria-disabled={disabled}
            style={{
              cursor: disabled ? "no-drop" : undefined,
            }}
            onClick={(event) => {
              if (disabled) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
          >
            {content}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Combined Filter sheet ("Filter & Selection", v1.5.14, AC-P4-01-54/55/56/57)
 * — grouped-radio redesign of the A7/v1.4.0 combined sheet: Product and Time
 * Period each render as their own bordered card of radio rows (business line
 * no longer a segmented control, period no longer shows a date-range
 * subtitle); Scheme/Group render as a third card only when visible. All
 * selections stage locally and commit together on a single Apply tap — no
 * refetch until then. Applies via the same `refetch` params the mobile
 * controls already used; no new BFF contract.
 */
export function FilterSheet({
  f,
  onApply,
  onClose,
}: {
  f: DashboardFiltersVM;
  onApply: (patch: {
    period: PeriodType;
    businessLine: BusinessLine;
    basis: Basis;
    teamView?: TeamView;
  }) => void;
  onClose: () => void;
}) {
  const [period, setPeriod] = useState<PeriodType>(f.period);
  const [businessLine, setBusinessLine] = useState<BusinessLine>(
    f.businessLine,
  );
  const [basis] = useState<Basis>(f.basis);
  const [teamView, setTeamView] = useState<TeamView | undefined>(f.teamView);
  // Below tablet the View sheet owns Direct/Group (v1.5.18); tablet/desktop keep
  // the Group toggle here (AC-P4-01-57). The Scheme toggle stays hidden (OQ-20).
  const isTabletUp = useIsTabletUp();
  const showGroupToggle = f.teamViewToggleVisible && isTabletUp;
  return (
    <BottomSheet
      className="filter-sheet"
      backdropClassName="filter-sheet-backdrop"
      align="none"
      title={t("insights.filter.title")}
      onClose={onClose}
    >
      <div className="filter-card">
        <div className="section-label">
          {t("insights.filter.sectionProduct")}
        </div>
        <RadioSheetList
          value={businessLine}
          options={f.businessLineOptions}
          onChange={setBusinessLine}
          label={(bl) => t(`insights.businessLine.${bl}`)}
        />
      </div>
      <div className="filter-card">
        <div className="section-label">{t("insights.period.sheetTitle")}</div>
        <RadioSheetList
          value={period}
          options={f.periodOptions}
          onChange={setPeriod}
          label={(p) => t(`insights.period.${p}`)}
        />
      </div>
      {showGroupToggle && (
        <div className="filter-card">
          <ToggleRow
            label={t("insights.teamView.toggle")}
            on={teamView === "GROUP"}
            onChange={(on) => setTeamView(on ? "GROUP" : "DIRECT")}
          />
        </div>
      )}
      <button
        className="btn-primary"
        style={{ marginTop: 4 }}
        onClick={() => {
          onApply({ period, businessLine, basis, teamView });
          onClose();
        }}
      >
        {t("insights.common.apply")}
      </button>
    </BottomSheet>
  );
}

/**
 * More actions trigger + chrome (Figma 6588:16896: rows 52h, lead icons).
 * Below `breakpoint.tablet` (<768px): full-width `BottomSheet`, X close,
 * dimmed backdrop — unchanged. At `breakpoint.tablet`/`breakpoint.desktop`
 * (S-P4-01 v1.5.16, `AC-P4-01-59`–`62`): an anchored `MenuPopover` under the
 * trigger, no dimmed backdrop, no X — dismisses via outside click/Escape/row
 * selection, reusing the same anchored-menu primitive as the header scope
 * switcher (`ScopePill`). Row content/order is identical either way.
 *
 * `interceptActionIds` lets a caller intercept specific rows (S-P4-01
 * v1.5.15, AC-P4-01-58): at breakpoint.tablet/desktop, "Customize Metrics"
 * opens in place over the still-mounted dashboard instead of navigating —
 * every other row keeps its normal `<Link>` navigation.
 */
export function MoreActionsControl({
  actions,
  interceptActionIds,
  onIntercept,
}: {
  actions: MoreActionVM[];
  interceptActionIds?: Set<string>;
  onIntercept?: (action: MoreActionVM) => void;
}) {
  const [open, setOpen] = useState(false);
  const isTabletUp = useIsTabletUp();
  const close = () => setOpen(false);

  const rows = actions.map((a) =>
    interceptActionIds?.has(a.id) ? (
      // `SheetRow` is itself a <button> — no wrapping element, unlike
      // the <Link>-wrapped rows below, to avoid a nested-button DOM.
      <SheetRow
        key={a.id}
        leadToken={`sheet.${a.id}`}
        label={t(`insights.action.${a.id}.title`)}
        onClick={() => {
          onIntercept?.(a);
          close();
        }}
      />
    ) : (
      <Link
        key={a.id}
        to={href(a.nav)}
        onClick={close}
        style={{ display: "block" }}
      >
        <SheetRow
          leadToken={`sheet.${a.id}`}
          label={t(`insights.action.${a.id}.title`)}
        />
      </Link>
    ),
  );

  return (
    <span style={{ position: "relative", flex: "0 0 auto" }}>
      <button
        type="button"
        className="more-actions-btn"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon token="more-vert" size={16} tone="var(--color-text)" />
      </button>
      {open &&
        (isTabletUp ? (
          <MenuPopover onClose={close}>{rows}</MenuPopover>
        ) : (
          <BottomSheet
            title={t("insights.dashboard.metricTracking")}
            onClose={close}
          >
            {rows}
          </BottomSheet>
        ))}
    </span>
  );
}

/* ── Scheme / Group toggle row is styled by dls-stub ToggleRow ─────────── */
export { ToggleRow } from "@/dls-stub";

/* ── Scope switcher (S-P4-01): mobile View sheet, desktop/tablet pill ─────
   Mobile keeps the icon + chevron trigger but stages Self/Team selection in a
   bottom sheet until Apply. Tablet/desktop retain the anchored ScopePill menu.
   The accessible name is fixed at "Scope switcher" at every breakpoint. */
export function ScopeSwitcher({
  vm,
  teamView,
  onSelect,
}: {
  vm: ScopeSwitcherVM;
  teamView?: TeamView;
  onSelect: (s: Scope, teamView?: TeamView) => void;
}) {
  const isTabletUp = useIsTabletUp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stagedScope, setStagedScope] = useState<Scope>(vm.current);
  const [stagedTeamView, setStagedTeamView] = useState<TeamView>(teamView ?? "DIRECT");
  const [teamMenuOpen, setTeamMenuOpen] = useState(false);
  const teamViewOptions = vm.teamViewOptions ?? [];
  const showTeamView = stagedScope === "TEAM" && teamViewOptions.length > 1;

  useEffect(() => {
    setStagedScope(vm.current);
    setStagedTeamView(teamView ?? "DIRECT");
    setTeamMenuOpen(false);
    setMobileOpen(false);
  }, [vm.current, teamView, isTabletUp]);

  const close = () => {
    setTeamMenuOpen(false);
    setMobileOpen(false);
  };

  const scopeIcon = (scope: Scope) => (scope === "SELF" ? "scope-self" : "scope-team");

  const options = vm.options.map((o) => ({
    key: o.scope,
    label: t(`insights.scope.${o.scope}`),
    selected: o.scope === vm.current,
    icon: scopeIcon(o.scope),
  }));

  if (isTabletUp) {
    return (
      <ScopePill
        icon={vm.current === "TEAM" ? "scope-team-sm" : scopeIcon(vm.current)}
        ariaLabel="Scope switcher"
        label={t(`insights.scope.${vm.current}`)}
        options={options}
        onSelect={(key) => onSelect(key as Scope)}
      />
    );
  }

  return (
    <>
      <button
        className="scope-pill"
        aria-haspopup="dialog"
        aria-expanded={mobileOpen}
        aria-label="Scope switcher"
        onClick={() => {
          setStagedScope(vm.current);
          setStagedTeamView(teamView ?? "DIRECT");
          setTeamMenuOpen(false);
          setMobileOpen(true);
        }}
      >
        {/* Figma "User" glyph (24, built-in padding) — the mobile button draws
            one person icon for every scope; the sheet shows the selection. */}
        <Icon token="scope-user" size={24} tone="var(--color-text)" />
        <Icon token="arrow-down-s" size={16} tone="var(--color-text)" />
      </button>
      {mobileOpen && (
        <BottomSheet
          className={`scope-sheet ${teamMenuOpen ? "team-menu-open" : ""}`}
          backdropClassName="scope-sheet-backdrop"
          closeIconTone="var(--view-muted)"
          title={t("insights.scope.sheetTitle")}
          onClose={close}
        >
          <div className="scope-sheet-options">
            <RadioSheetList
              value={stagedScope}
              options={vm.options.map((o) => o.scope)}
              onChange={(scope) => {
                if (scope !== stagedScope) setStagedTeamView("DIRECT");
                setStagedScope(scope);
                setTeamMenuOpen(false);
              }}
              label={(scope) => t(`insights.scope.${scope}`)}
            />
            {showTeamView && (
              <RadioDropdown
                value={stagedTeamView}
                options={teamViewOptions}
                label={(value) => t(`insights.teamView.${value}`)}
                ariaLabel={t("insights.teamView.label")}
                onChange={setStagedTeamView}
                open={teamMenuOpen}
                onOpenChange={setTeamMenuOpen}
              />
            )}
            {stagedScope === "TEAM" && !showTeamView && (
              <RadioDropdown
                value="DIRECT"
                options={["DIRECT"]}
                label={(value) => t(`insights.teamView.${value}`)}
                ariaLabel={t("insights.teamView.label")}
                onChange={() => {}}
                open={false}
                onOpenChange={() => {}}
                disabled
              />
            )}
          </div>
          <div className="scope-sheet-actions">
            <button
              className="scope-sheet-cancel"
              onClick={close}
            >
              {t("insights.common.cancel")}
            </button>
            <button
              className="scope-sheet-apply"
              onClick={() => {
                const nextTeamView = stagedScope === "TEAM"
                  ? (showTeamView ? stagedTeamView : (vm.current === "TEAM" ? teamView ?? "DIRECT" : "DIRECT"))
                  : undefined;
                close();
                if (stagedScope !== vm.current || nextTeamView !== teamView) {
                  onSelect(stagedScope, nextTeamView);
                }
              }}
            >
              {t("insights.common.apply")}
            </button>
          </div>
        </BottomSheet>
      )}
    </>
  );
}

export function PersonaPicker({ current }: { current?: string }) {
  const { setPersonaId } = usePersona();
  return (
    <span className="persona">
      <select
        aria-label="Dev persona"
        defaultValue={current}
        onChange={(e) => {
          setPersonaId(e.target.value as PersonaId);
          // Full reload (not a router navigation): every CDK page loads its
          // own data once on mount, so a hard reload is the simplest way to
          // guarantee everything on screen reflects the new persona.
          location.href = "/insights/performance";
        }}
      >
        {PERSONAS.map((p) => (
          <option key={p.id} value={p.id} title={p.label}>
            {p.id.slice(p.id.lastIndexOf("_") + 1)}
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
export function RecoPanel({
  vm,
  expandedInitial = false,
}: {
  vm: RecommendationsPanelVM;
  expandedInitial?: boolean;
}) {
  const [feedback, setFeedback] = useState(vm.feedback);
  const [busy, setBusy] = useState(false);
  const sendFeedback = async (rating: "UP" | "DOWN") => {
    if (busy) return;
    const prev = feedback;
    setFeedback(rating);
    setBusy(true);
    try {
      const res = await apiFetch(
        `/api/bff/v1/performance/recommendations/${vm.recommendationId}/feedback`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rating }),
        },
      );
      if (!res.ok) setFeedback(prev);
    } catch {
      setFeedback(prev);
    } finally {
      setBusy(false);
    }
  };
  const generated = new Date(vm.generatedAt);
  const genText = t("insights.reco.generatedAt", {
    date: generated.toISOString().slice(0, 10),
    time: `${String(generated.getUTCHours()).padStart(2, "0")}:${String(generated.getUTCMinutes()).padStart(2, "0")}`,
  });
  return (
    <Collapse
      defaultOpen={expandedInitial}
      trigger={({ open, toggle, buttonProps }) => (
        <button
          {...buttonProps}
          className={`reco-bar ${open ? "open" : ""}`}
          onClick={toggle}
        >
          <Icon token="sparkle" size={16} tone="#fff" />
          <span style={{ flex: 1, textAlign: "left" }}>
            {t("insights.reco.banner")}
          </span>
          <Icon
            token={open ? "arrow-up-s" : "arrow-down-s"}
            size={18}
            tone="#fff"
          />
        </button>
      )}
    >
      <div className="reco-panel">
        {vm.flags.length > 0 && (
          <div>
            {vm.flags.map((f) => (
              <div key={f.code} className="spread" style={{ minHeight: 24 }}>
                <span className="title14">
                  {t(`insights.reco.flag.${f.code}`)}
                </span>
                <span aria-hidden>
                  {f.severity === "CRITICAL"
                    ? "🚨"
                    : f.severity === "WARNING"
                      ? "⚠️"
                      : "ℹ️"}
                </span>
              </div>
            ))}
          </div>
        )}
        {vm.highlight && (
          <div style={{ marginTop: 10 }}>
            <div className="spread">
              <span className="title14">
                {t("insights.reco.secured", {
                  value: formatScalar(vm.highlight.achieved),
                  metric: t(`insights.metric.${vm.highlight.metricCode}.title`),
                })}
              </span>
              {vm.highlight.goal?.state === "SET" &&
                vm.highlight.goal.target && (
                  <span className="caption muted">
                    {t("insights.reco.goalLine", {
                      goal: formatScalar(vm.highlight.goal.target),
                      pct: String(
                        Math.round(vm.highlight.goal.progressPct ?? 0),
                      ),
                    })}
                  </span>
                )}
            </div>
            {vm.highlight.goal?.state === "SET" && (
              <ProgressBar
                pct={clampPct(vm.highlight.goal.progressPct)}
                brand
              />
            )}
            {vm.highlight.runRateDeltaPct !== undefined && (
              <div
                className="caption"
                style={{
                  marginTop: 6,
                  color:
                    vm.highlight.runRateDeltaPct >= 0
                      ? "var(--tone-success)"
                      : "var(--tone-danger)",
                }}
              >
                {t(
                  vm.highlight.runRateDeltaPct >= 0
                    ? "insights.reco.runRateAbove"
                    : "insights.reco.runRateBelow",
                  { pct: String(Math.abs(vm.highlight.runRateDeltaPct)) },
                )}
              </div>
            )}
          </div>
        )}
        {vm.insights.map((i) => {
          const body = (
            <span className="spread">
              <span>
                <span className="title14">
                  {t(`insights.reco.insight.${i.titleCode}`)}
                </span>
                {i.trend && (
                  <span
                    className="caption"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color:
                        i.trend.sentiment === "NEGATIVE"
                          ? "var(--tone-danger)"
                          : "var(--tone-success)",
                    }}
                  >
                    <Icon
                      token="arrow-upward"
                      size={12}
                      tone="currentColor"
                      style={
                        i.trend.direction === "DOWN"
                          ? { transform: "rotate(180deg)" }
                          : undefined
                      }
                    />
                    {i.trend.text}
                  </span>
                )}
                {i.narrative && (
                  <span
                    className="caption muted"
                    style={{ display: "block", marginTop: 4 }}
                  >
                    {i.narrative}
                  </span>
                )}
              </span>
              {i.nav && (
                <Icon
                  token="arrow-right-s"
                  size={20}
                  tone="var(--color-text-muted)"
                />
              )}
            </span>
          );
          return i.nav ? (
            <Link key={i.code} to={href(i.nav)} className="reco-insight">
              {body}
            </Link>
          ) : (
            <div key={i.code} className="reco-insight">
              {body}
            </div>
          );
        })}
        {vm.cta && (
          <Link
            to={href(vm.cta.nav)}
            className="spread text-semibold"
            style={{ marginTop: 12 }}
          >
            <span className="row">
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: "var(--color-brand)",
                }}
              />
              {t("insights.reco.viewTeamDrilldown")}
            </span>
            <Icon
              token="arrow-right-s"
              size={20}
              tone="var(--color-text-muted)"
            />
          </Link>
        )}
        <div className="reco-footer">
          <span className="row caption muted">
            <Icon token="refresh" size={16} tone="var(--color-text-muted)" />
            {genText}
          </span>
          <span className="row" style={{ gap: 4 }}>
            <IconButton
              token="thumb-up"
              label="Helpful"
              size={18}
              onClick={() => sendFeedback("UP")}
            />
            <IconButton
              token="thumb-down"
              label="Not helpful"
              size={18}
              onClick={() => sendFeedback("DOWN")}
            />
          </span>
        </div>
        {feedback && (
          <div
            className="caption muted"
            style={{ marginTop: 6, textAlign: "right" }}
          >
            {feedback === "UP" ? "👍" : "👎"}
          </div>
        )}
      </div>
    </Collapse>
  );
}
