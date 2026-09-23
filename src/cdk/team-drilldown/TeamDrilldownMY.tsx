import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ContextPill, ToggleRow } from "@/components/chrome";
import { MetricCard } from "@/components/metrics";
import { StateProcessing } from "@/components/ui";
import { CarouselRow, FilterButton, Icon, Tag } from "@/dls-stub";
import { apiFetch } from "@/lib/apiClient";
import { formatDateAsOf } from "@/lib/format";
import { t } from "@/lib/i18n";
import type {
  Basis,
  BusinessLine,
  DrilldownBasis,
  PeriodType,
  TeamDrilldownVM,
  TeamView,
} from "@spec/performance-vm";

const TEAM_VIEWS: TeamView[] = ["DIRECT", "GROUP"];
const HIERARCHY_BASIS: DrilldownBasis[] = ["AGENT", "AM", "UM"];
const PERIODS: PeriodType[] = ["MTD", "QTD", "YTD"];
const BUSINESS_LINES: BusinessLine[] = ["ALL", "INSURANCE", "TAKAFUL"];
const PERFORMANCE_BASIS: Basis[] = ["STANDARD", "SCHEME"];

interface TeamDrilldownQueryState {
  teamView: TeamView;
  basis: DrilldownBasis;
  query: string;
  period: PeriodType;
  businessLine: BusinessLine;
  performanceBasis: Basis;
  selectedAgentId?: string;
}

function parseEnum<T extends string>(
  value: string | null,
  options: readonly T[],
  fallback: T,
): T {
  return value && (options as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

function parseState(searchParams: URLSearchParams): TeamDrilldownQueryState {
  const teamView = parseEnum(searchParams.get("teamView"), TEAM_VIEWS, "DIRECT");
  const basis = parseEnum(searchParams.get("basis"), HIERARCHY_BASIS, "AGENT");
  const period = parseEnum(searchParams.get("period"), PERIODS, "YTD");
  const businessLine = parseEnum(
    searchParams.get("businessLine"),
    BUSINESS_LINES,
    "ALL",
  );
  const performanceBasis = parseEnum(
    searchParams.get("performanceBasis"),
    PERFORMANCE_BASIS,
    "STANDARD",
  );
  const query = (searchParams.get("query") ?? "").trim();
  const selectedAgentId = searchParams.get("selectedAgentId")?.trim() || undefined;
  return {
    teamView,
    basis,
    query,
    period,
    businessLine,
    performanceBasis,
    selectedAgentId,
  };
}

function buildStateParams(state: TeamDrilldownQueryState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("teamView", state.teamView);
  params.set("basis", state.basis);
  params.set("period", state.period);
  params.set("businessLine", state.businessLine);
  params.set("performanceBasis", state.performanceBasis);
  if (state.query) params.set("query", state.query);
  if (state.selectedAgentId) params.set("selectedAgentId", state.selectedAgentId);
  return params;
}

/** S-P4-07 (MY) - Team Drilldown using TeamDrilldownVM from the existing BFF contract. */
export default function TeamDrilldownMY() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramsKey = searchParams.toString();
  const filters = useMemo(() => parseState(searchParams), [paramsKey]);
  const [searchInput, setSearchInput] = useState(filters.query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [vm, setVm] = useState<TeamDrilldownVM | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<number | null>(null);
  const loadSeq = useRef(0);
  const memberSectionRef = useRef<HTMLDivElement | null>(null);
  const previewSectionRef = useRef<HTMLDivElement | null>(null);

  const updateState = useCallback(
    (patch: Partial<TeamDrilldownQueryState>, replace = false) => {
      const next = { ...filters, ...patch };
      setSearchParams(buildStateParams(next), { replace });
    },
    [filters, setSearchParams],
  );

  const load = useCallback(async (state: TeamDrilldownQueryState) => {
    const seq = ++loadSeq.current;
    setLoading(true);
    const qs = new URLSearchParams({
      teamView: state.teamView,
      basis: state.basis,
      period: state.period,
      businessLine: state.businessLine,
      performanceBasis: state.performanceBasis,
    });
    if (state.query) qs.set("query", state.query);
    if (state.selectedAgentId) qs.set("selectedAgentId", state.selectedAgentId);
    try {
      const res = await apiFetch(`/api/bff/v1/performance/team-drilldown?${qs}`);
      if (seq !== loadSeq.current) return;
      if (!res.ok) {
        setError(res.status);
        setVm(null);
        return;
      }
      const data: TeamDrilldownVM = await res.json();
      setVm(data);
      setError(null);
    } catch {
      if (seq === loadSeq.current) {
        setError(500);
        setVm(null);
      }
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSearchInput(filters.query);
  }, [filters.query]);

  useEffect(() => {
    const normalized = searchInput.trim();
    if (normalized === filters.query) return;
    const timeout = window.setTimeout(() => {
      updateState({ query: normalized }, true);
    }, 260);
    return () => window.clearTimeout(timeout);
  }, [searchInput, filters.query, updateState]);

  useEffect(() => {
    void load(filters);
  }, [filters, load]);

  const members = vm?.members ?? [];
  const selected = vm?.selectedMember;
  const previewLoading = loading && Boolean(filters.selectedAgentId);
  const asOfDate = selected?.context.asOfDate ?? vm?.meta.asOfDate;

  const onRecoDockClick = useCallback(() => {
    if (selected || previewLoading) {
      previewSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }
    memberSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [memberSectionRef, previewLoading, previewSectionRef, selected]);

  return (
    <>
      <div className="appbar detail-appbar team-drill-appbar">
        <button
          className="back"
          aria-label={t("insights.common.back")}
          onClick={() => navigate(-1)}
        >
          {"\u2190"}
          <span className="back-label">{t("insights.common.back")}</span>
        </button>
        {asOfDate && (
          <span className="detail-asof muted">{formatDateAsOf(asOfDate)}</span>
        )}
      </div>

      <div className="section">
        <h1 className="page-title">{t("insights.teamDrilldown.title")}</h1>
      </div>

      <div className="section card pad team-drill-toolbar">
        <div className="team-drill-search-row">
          <input
            className="team-drill-search-input"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t("insights.teamDrilldown.searchPlaceholder")}
            aria-label={t("insights.teamDrilldown.searchPlaceholder")}
          />
          <FilterButton
            label={t("insights.action.FILTER")}
            onClick={() => setFiltersOpen((open) => !open)}
          />
        </div>

        <div className="team-drill-active-filters">
          <Tag>{t(`insights.teamView.${filters.teamView}`)}</Tag>
          <Tag>{t(`insights.teamDrilldown.basis.${filters.basis}`)}</Tag>
          <Tag>{t(`insights.businessLine.${filters.businessLine}`)}</Tag>
          <Tag>{t(`insights.period.${filters.period}`)}</Tag>
          {filters.performanceBasis === "SCHEME" && (
            <Tag>{t("insights.basis.SCHEME.toggle")}</Tag>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="section card pad team-drill-filter-panel">
          <div className="team-drill-filter-group">
            <div className="section-label">{t("insights.teamView.label")}</div>
            <div className="segtabs" role="tablist">
              {TEAM_VIEWS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={filters.teamView === option}
                  className={`seg ${filters.teamView === option ? "active" : ""}`}
                  onClick={() => updateState({ teamView: option })}
                >
                  {t(`insights.teamView.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="team-drill-filter-group">
            <div className="section-label">
              {t("insights.teamDrilldown.hierarchyBasisLabel")}
            </div>
            <div className="pillrow">
              {HIERARCHY_BASIS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`pill ${filters.basis === option ? "active" : ""}`}
                  onClick={() => updateState({ basis: option })}
                >
                  {t(`insights.teamDrilldown.basis.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="team-drill-filter-group">
            <div className="section-label">{t("insights.dashboard.filter.product")}</div>
            <div className="segtabs" role="tablist">
              {BUSINESS_LINES.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="tab"
                  aria-selected={filters.businessLine === option}
                  className={`seg ${filters.businessLine === option ? "active" : ""}`}
                  onClick={() => updateState({ businessLine: option })}
                >
                  {t(`insights.businessLine.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="team-drill-filter-group">
            <div className="section-label">{t("insights.dashboard.filter.time")}</div>
            <div className="pillrow">
              {PERIODS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`pill ${filters.period === option ? "active" : ""}`}
                  onClick={() => updateState({ period: option })}
                >
                  {t(`insights.period.${option}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="team-drill-filter-group">
            <ToggleRow
              label={t("insights.basis.SCHEME.toggle")}
              on={filters.performanceBasis === "SCHEME"}
              onChange={(on) =>
                updateState({ performanceBasis: on ? "SCHEME" : "STANDARD" })
              }
            />
          </div>
        </div>
      )}

      <div className="section">
        <div className="team-drill-summary-grid">
          <div className="team-drill-summary-tile card">
            <span className="team-drill-summary-label muted caption">
              {t("insights.teamDrilldown.memberSection")}
            </span>
            <span className="team-drill-summary-value">{String(members.length)}</span>
          </div>
          <div className="team-drill-summary-tile card">
            <span className="team-drill-summary-label muted caption">
              {t("insights.teamDrilldown.previewSection")}
            </span>
            <span className="team-drill-summary-value">
              {selected ? String(selected.metrics.length) : t("insights.common.na")}
            </span>
          </div>
          <div className="team-drill-summary-tile card">
            <span className="team-drill-summary-label muted caption">
              {t("insights.teamView.label")}
            </span>
            <span className="team-drill-summary-value">
              {t(`insights.teamView.${filters.teamView}`)}
            </span>
          </div>
        </div>
      </div>

      <div className="section spread" ref={memberSectionRef}>
        <span className="title14">{t("insights.teamDrilldown.memberSection")}</span>
        <Tag>{String(members.length)}</Tag>
      </div>

      {error !== null && !vm && (
        <div className="section card state">
          <div className="glyph" aria-hidden>
            {"\u26A0\uFE0F"}
          </div>
          <h3>{t("insights.state.empty.title")}</h3>
          <p className="muted caption">{t("insights.notice.generic")}</p>
          <button className="btn-outline" onClick={() => void load(filters)}>
            {t("insights.state.processing.refresh")}
          </button>
        </div>
      )}

      {error === null && loading && !vm && (
        <div className="section">
          <StateProcessing onRefresh={() => void load(filters)} />
        </div>
      )}

      {error === null && vm && (
        <>
          {members.length === 0 ? (
            <div className="section card state">
              <div className="glyph" aria-hidden>
                🕊️
              </div>
              <h3>{t("insights.state.empty.title")}</h3>
              <p className="muted caption">
                {t("insights.teamDrilldown.emptySearch")}
              </p>
            </div>
          ) : (
            <div className="section team-drill-member-list">
              {members.map((member) => {
                const isSelected = filters.selectedAgentId === member.agentId;
                return (
                  <button
                    key={member.agentId}
                    type="button"
                    className={`team-drill-member-card ${isSelected ? "selected" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => updateState({ selectedAgentId: member.agentId })}
                  >
                    <span className="team-drill-member-main">
                      <span className="text-semibold">{member.displayName}</span>
                      <span className="caption muted">{member.agentId}</span>
                    </span>
                    <span className="team-drill-member-meta">
                      <Tag>{t(`insights.teamDrilldown.basis.${member.hierarchyBasis}`)}</Tag>
                      {isSelected ? (
                        <span className="team-drill-selected" aria-hidden>
                          ✓
                        </span>
                      ) : (
                        <Icon
                          token="arrow-right-s"
                          size={20}
                          tone="var(--color-text-muted)"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {(selected || previewLoading) && (
        <>
          <div className="section" ref={previewSectionRef}>
            <span className="title14">{t("insights.teamDrilldown.previewSection")}</span>
          </div>

          {previewLoading && (
            <div className="section">
              <StateProcessing onRefresh={() => void load(filters)} />
            </div>
          )}

          {selected && !previewLoading && (
            <>
              <div className="section card pad team-drill-preview-card">
                <div className="team-drill-preview-head">
                  <div>
                    <div className="title14">{selected.member.displayName}</div>
                    <div className="caption muted">{selected.member.agentId}</div>
                  </div>
                  <Tag>{t(`insights.teamView.${selected.context.teamView}`)}</Tag>
                </div>

                <div className="team-drill-preview-tags">
                  <Tag>{t(`insights.teamDrilldown.basis.${selected.member.hierarchyBasis}`)}</Tag>
                  {selected.context.basis === "SCHEME" && (
                    <Tag>{t("insights.basis.SCHEME.toggle")}</Tag>
                  )}
                </div>

                <div className="team-drill-preview-context">
                  <ContextPill
                    labelKey="insights.dashboard.filter.product"
                    value={t(`insights.businessLine.${selected.context.businessLine}`)}
                  />
                  <ContextPill
                    labelKey="insights.dashboard.filter.time"
                    value={t(`insights.period.${selected.context.period}`)}
                  />
                </div>
              </div>

              {selected.metrics.length > 0 && (
                <div className="section team-drill-preview-metrics">
                  <CarouselRow count={selected.metrics.length} className="focus-grid">
                    {selected.metrics.map((metric) => (
                      <MetricCard
                        key={`${selected.member.agentId}_${metric.metricCode}`}
                        vm={metric}
                        variant="simple"
                      />
                    ))}
                  </CarouselRow>
                </div>
              )}
            </>
          )}
        </>
      )}

      {vm && (
        <div className="team-drill-reco-dock">
          <button
            type="button"
            className="team-drill-reco-btn"
            onClick={onRecoDockClick}
          >
            <span className="row">
              <Icon token="sparkle" size={16} tone="#fff" />
              <span>{t("insights.reco.banner")}</span>
            </span>
            <Icon token="arrow-up-s" size={18} tone="#fff" />
          </button>
        </div>
      )}
    </>
  );
}
