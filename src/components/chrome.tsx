import { Link } from "react-router-dom";
import { useState } from "react";
import { t } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { formatScalar } from "@/lib/format";
import { PERSONAS, type PersonaId } from "@/lib/persona";
import { usePersona } from "@/lib/usePersona";
import { apiFetch } from "@/lib/apiClient";
import { Collapse, Tabs, clampPct } from "@/headless";
import {
  BottomSheet,
  Icon,
  IconButton,
  ProgressBar,
  RadioSheetList,
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

/* ── w.quick-links (tiles 80×122, icon 62, per Figma 6588:16556) ───────── */
export function QuickLinkRail({ links }: { links: QuickLinkVM[] }) {
  return (
    <nav className="quick" aria-label="Quick links">
      {links.map((l) => (
        <Link key={l.id} to={href(l.nav)}>
          <span className="ic">
            <Icon token={`quick.${l.id}`} size={26} tone="var(--color-brand)" />
          </span>
          <span className="lbl">{t(`insights.quicklink.${l.id}`)}</span>
        </Link>
      ))}
    </nav>
  );
}

/**
 * Desktop Filter sheet (A7, v1.4.0, screenshot-derived) — combines business
 * line, period and basis/team-view selection (mobile's separate tabs/period
 * button/toggle rows) into one sheet. Applies via the same `refetch` params
 * the mobile controls already use; no new BFF contract.
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
  const [basis, setBasis] = useState<Basis>(f.basis);
  const [teamView, setTeamView] = useState<TeamView | undefined>(f.teamView);
  const sub = (p: PeriodType) => {
    const m = f.periodOptionsMeta?.find((x) => x.period === p);
    if (!m) return undefined;
    const d = new Date(`${m.startDate}T00:00:00Z`);
    const start = `${d.getUTCDate()} ${d.toLocaleString("en", { month: "short", timeZone: "UTC" })} ${d.getUTCFullYear()}`;
    return t("insights.period.range", { start });
  };
  return (
    <BottomSheet title={t("insights.action.FILTER")} onClose={onClose}>
      <div className="section-label" style={{ marginBottom: 8 }}>
        {t("insights.dashboard.filter.product")}
      </div>
      <Tabs<BusinessLine>
        value={businessLine}
        options={f.businessLineOptions}
        className="segtabs"
        onChange={setBusinessLine}
        renderTab={(bl, selected) => (
          <span
            className={`seg ${selected ? "active" : ""}`}
            style={{ display: "block" }}
          >
            {t(`insights.businessLine.${bl}`)}
          </span>
        )}
      />
      <div className="section-label" style={{ marginTop: 16, marginBottom: 8 }}>
        {t("insights.dashboard.filter.time")}
      </div>
      <RadioSheetList
        value={period}
        options={f.periodOptions}
        onChange={setPeriod}
        label={(p) => t(`insights.period.${p}`)}
        sub={sub}
      />
      {f.basisToggleVisible && (
        <ToggleRow
          label={t("insights.basis.SCHEME.toggle")}
          on={basis === "SCHEME"}
          onChange={(on) => setBasis(on ? "SCHEME" : "STANDARD")}
        />
      )}
      {f.teamViewToggleVisible && (
        <ToggleRow
          label={t("insights.teamView.toggle")}
          on={teamView === "GROUP"}
          onChange={(on) => setTeamView(on ? "GROUP" : "DIRECT")}
        />
      )}
      <button
        className="btn-primary"
        style={{ marginTop: 12 }}
        onClick={() => {
          onApply({ period, businessLine, basis, teamView });
          onClose();
        }}
      >
        {t("insights.common.select")}
      </button>
    </BottomSheet>
  );
}

/* ── More actions — bottom sheet (Figma 6588:16896: rows 52h, lead icons) ─ */
export function MoreActionsSheet({
  actions,
  onClose,
}: {
  actions: MoreActionVM[];
  onClose: () => void;
}) {
  return (
    <BottomSheet
      title={t("insights.dashboard.metricTracking")}
      onClose={onClose}
    >
      {actions.map((a) => (
        <Link
          key={a.id}
          to={href(a.nav)}
          onClick={onClose}
          style={{ display: "block" }}
        >
          <SheetRow
            leadToken={`sheet.${a.id}`}
            label={t(`insights.action.${a.id}.title`)}
          />
        </Link>
      ))}
    </BottomSheet>
  );
}

/* ── Scheme / Group toggle row is styled by dls-stub ToggleRow ─────────── */
export { ToggleRow } from "@/dls-stub";

/* ── Scope switcher (v1.5.4, native select styled like PersonaPicker) ───── */
export function ScopeSwitcher({
  vm,
  onSelect,
}: {
  vm: ScopeSwitcherVM;
  onSelect: (s: Scope) => void;
}) {
  return (
    <span className="persona">
      <select
        aria-label="Scope switcher"
        value={vm.current}
        onChange={(e) => onSelect(e.target.value as Scope)}
      >
        {vm.options.map((o) => (
          <option key={o.scope} value={o.scope}>
            {t(`insights.scope.${o.scope}`)}
          </option>
        ))}
      </select>
    </span>
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
