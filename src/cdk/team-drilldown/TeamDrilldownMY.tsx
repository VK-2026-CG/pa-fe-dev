import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ContextPill } from "@/components/chrome";
import { StateProcessing } from "@/components/ui";
import { FilterButton, Icon, SearchField } from "@/dls-stub";
import { apiFetch } from "@/lib/apiClient";
import { formatDateAsOfNumeric } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { MemberBadgeCode, TeamDrilldownSortBy, TeamDrilldownVM, TeamMemberVM } from "@spec/performance-vm";
import { FiltersDrawer } from "./parts/FiltersDrawer";
import { MemberCard } from "./parts/MemberCard";
import { SummaryTiles } from "./parts/SummaryTiles";

const TEAM_PATH = "/insights/team-drilldown";

/** URL-held list state (S-P4-07 0.2.0 §3.4): Back / Exit View restore it. */
interface ListState {
  query: string;
  sortBy: TeamDrilldownSortBy;
  badges: MemberBadgeCode[];
  /**
   * Manager (member agentId) whose team is drilled into; absent ⇒ the caller's
   * own team. Each level is its own history entry, so Back climbs one level.
   */
  sub?: string;
}

function parseState(params: URLSearchParams): ListState {
  const sortBy = params.get("sortBy") === "PTPC" ? "PTPC" : "TPC";
  const badges = (params.get("badges") ?? "").split(",").map((b) => b.trim()).filter(Boolean) as MemberBadgeCode[];
  return {
    query: (params.get("query") ?? "").trim(),
    sortBy,
    badges,
    sub: params.get("sub")?.trim() || undefined,
  };
}

function toParams(state: ListState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.query) params.set("query", state.query);
  if (state.sortBy !== "TPC") params.set("sortBy", state.sortBy);
  if (state.badges.length) params.set("badges", state.badges.join(","));
  if (state.sub) params.set("sub", state.sub);
  return params;
}

/** S-P4-07 (MY) — "My Team" for AM/UM leaders (spec 0.2.0, SPEC-2026-004). */
export default function TeamDrilldownMY() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const state = useMemo(() => parseState(searchParams), [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const [searchInput, setSearchInput] = useState(state.query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [vm, setVm] = useState<TeamDrilldownVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const loadSeq = useRef(0);

  const update = useCallback(
    (patch: Partial<ListState>, replace = true) => setSearchParams(toParams({ ...state, ...patch }), { replace }),
    [state, setSearchParams],
  );

  // Search is debounced and replaces history so typing doesn't stack entries.
  useEffect(() => setSearchInput(state.query), [state.query]);
  useEffect(() => {
    const normalized = searchInput.trim();
    if (normalized === state.query) return;
    const timeout = window.setTimeout(() => update({ query: normalized }, true), 260);
    return () => window.clearTimeout(timeout);
  }, [searchInput, state.query, update]);

  const listKey = `${state.sub ?? ""}|${state.query}|${state.sortBy}|${state.badges.join(",")}`;
  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setFailed(false);
    const qs = new URLSearchParams({ sortBy: state.sortBy });
    if (state.sub) qs.set("parentAgentId", state.sub);
    if (state.query) qs.set("query", state.query);
    if (state.badges.length) qs.set("badges", state.badges.join(","));
    try {
      const res = await apiFetch(`/api/bff/v1/performance/team-drilldown?${qs}`);
      if (seq !== loadSeq.current) return;
      if (!res.ok) { setFailed(true); return; }
      setVm((await res.json()) as TeamDrilldownVM);
      setFailed(false);
    } catch {
      if (seq === loadSeq.current) setFailed(true);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [listKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [load]);

  // Moving between levels keeps the component mounted, so the previous level's
  // list must not show under the new level's heading while it loads.
  const current = vm && vm.filters.parentAgentId === state.sub ? vm : null;
  const members = current?.members ?? [];
  const sortOptions = current?.filterOptions ?? vm?.filterOptions;
  const manager = current?.parent;
  const title = !state.sub
    ? t("insights.teamDrilldown.title")
    : manager
      ? t("insights.teamDrilldown.subteamTitle", {
          name: manager.displayName,
          count: String(manager.directReportCount ?? members.length),
        })
      : "";

  /** Opens a manager's team as its own drill-down level; search/filters start clean there. */
  const openTeam = (member: TeamMemberVM) => update({ sub: member.agentId, query: "", badges: [] }, false);

  /** One level up through history (keeps each level's URL state); a cold-opened level falls back to the root list. */
  const goBack = () => {
    if (!state.sub) {
      navigate("/insights/performance", { replace: true });
      return;
    }
    const cameFromApp = (window.history.state?.idx ?? 0) > 0;
    if (cameFromApp) navigate(-1);
    else navigate(TEAM_PATH, { replace: true });
  };

  const badgeLabels = useMemo(() => {
    if (!state.badges.length || !sortOptions) return t("insights.teamDrilldown.allAgent");
    const order = sortOptions.badgeGroups.flatMap((g) => g.badges);
    return order.filter((b) => state.badges.includes(b)).map((b) => t(`insights.teamDrilldown.badge.${b}`)).join(", ");
  }, [state.badges, sortOptions]);

  return (
    <div className="td-page">
      <div className="td-header">
        <button type="button" className="td-back" onClick={goBack}>
          <Icon token="arrow-upward" size={24} tone="var(--td-ink-soft)" style={{ transform: "rotate(-90deg)" }} />
          <span>{t("insights.common.back")}</span>
        </button>
        <nav className="td-breadcrumb" aria-label={t("insights.teamDrilldown.breadcrumb")}>
          <Link to="/insights/performance">{t("insights.dashboard.title")}</Link>
          <Icon token="arrow-right-s" size={16} tone="var(--td-muted)" />
          {state.sub ? (
            <>
              <Link to={TEAM_PATH}>{t("insights.teamDrilldown.title")}</Link>
              <Icon token="arrow-right-s" size={16} tone="var(--td-muted)" />
              <span aria-current="page">{manager?.displayName ?? state.sub}</span>
            </>
          ) : (
            <span aria-current="page">{t("insights.teamDrilldown.title")}</span>
          )}
        </nav>
        {vm && <span className="td-asof">{formatDateAsOfNumeric(vm.meta.asOfDate)}</span>}
      </div>

      {title && <h1 className="td-title">{title}</h1>}

      <div className="td-search-row">
        <SearchField
          className="td-search"
          value={searchInput}
          onChange={setSearchInput}
          placeholder={t("insights.teamDrilldown.searchPlaceholder")}
        />
        <FilterButton label={t("insights.action.FILTER")} onClick={() => setFiltersOpen(true)} />
      </div>

      <div className="td-chips">
        <ContextPill
          className="td-chip"
          labelKey="insights.teamDrilldown.filters.title"
          value={badgeLabels}
          onClick={() => setFiltersOpen(true)}
        />
        <ContextPill
          className="td-chip"
          labelKey="insights.teamDrilldown.sortBy.label"
          value={t(`insights.metric.${state.sortBy}.title`)}
          onClick={() => setFiltersOpen(true)}
        />
      </div>

      {current?.summary && <SummaryTiles tiles={current.summary} />}

      {failed && !current && (
        <div className="td-state">
          <p>{t("insights.notice.generic")}</p>
          <button type="button" className="td-btn-outline" onClick={() => void load()}>
            {t("insights.state.processing.refresh")}
          </button>
        </div>
      )}
      {loading && !current && !failed && <StateProcessing onRefresh={() => void load()} />}

      {current && members.length === 0 && (
        <div className="td-state">
          <p>{t("insights.teamDrilldown.emptySearch")}</p>
        </div>
      )}
      {current && members.length > 0 && (
        <section className="td-panel" aria-label={t("insights.teamDrilldown.memberSection")}>
          {members.map((member) => (
            <MemberCard key={member.agentId} member={member} onOpenSubteam={openTeam} />
          ))}
        </section>
      )}

      {filtersOpen && sortOptions && (
        <FiltersDrawer
          options={sortOptions}
          sortBy={state.sortBy}
          badges={state.badges}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            setFiltersOpen(false);
            update(next);
          }}
        />
      )}
    </div>
  );
}
