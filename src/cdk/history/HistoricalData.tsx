import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { DownloadButton, FilterButton, Icon } from '@/dls-stub';
import { useIsDesktop } from '@/headless';
import { apiFetch } from '@/lib/apiClient';
import { formatDateAsOfNumeric } from '@/lib/format';
import {
  applySelectionToQuery, historicalComparisonLabel, historicalDataParams, historicalMetricLabel,
  isHistoricalDataVM, parseHistoricalSelection, placeholderGrid, sameSelection,
  type HistoricalQuery, type HistoricalSelection,
} from '@/lib/historical-data';
import type { Scope } from '@spec/performance-vm';
import { t } from '@/lib/i18n';
import type { HistoricalDataVM } from '@spec/performance-vm';
import { HistoricalCards } from './parts/HistoricalCards';
import { HistoricalDownloadSheet } from './parts/HistoricalDownloadSheet';
import { HistoricalFilterSheet } from './parts/HistoricalFilterSheet';
import { HistoricalSkeleton } from './parts/HistoricalSkeleton';
import { HistoricalTable } from './parts/HistoricalTable';

const DASHBOARD_PATH = '/insights/performance';

/**
 * Historical Data (S-P4-03 §B, ARVIJ-1450-SP01) — `/insights/history`, one screen
 * for SELF (the default) and TEAM (`?scope=TEAM`). Month cards below 1024px, a
 * table with an optional Total row at desktop. The selection (metric + variant +
 * comparison) lives in the URL: Apply rewrites it (replace, so Back leaves the
 * page) and the effect below refetches. The two context chips are read-only;
 * only the funnel button opens the sheet, whose metric options come from the VM; the Download button opens the
 * encrypted-PDF sheet (S-P4-03 §D).
 * Failure and "no data" keep the grid frame (12 months, "-" / "N/A").
 * The scope only changes the request (`scope`, and `teamView` for TEAM) and the
 * data the BFF returns — never the layout.
 */
export default function HistoricalData({ query, scope }: { query: HistoricalQuery; scope: Scope }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDesktop = useIsDesktop();
  const [vm, setVm] = useState<HistoricalDataVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const loadSeq = useRef(0);

  const selection = parseHistoricalSelection(query);
  const qs = historicalDataParams(query, selection, scope).toString();

  const load = useCallback(async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/bff/v1/performance/historical-data?${qs}`);
      if (seq !== loadSeq.current) return;
      const body: unknown = res.ok ? await res.json() : null;
      if (seq !== loadSeq.current) return;
      if (isHistoricalDataVM(body)) setVm(body);
      else setFailed(true);
    } catch {
      if (seq === loadSeq.current) setFailed(true);
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [qs]);
  useEffect(() => { void load(); }, [load]);

  const applySelection = (next: HistoricalSelection) => {
    setSheetOpen(false);
    if (sameSelection(next, selection)) return;
    setSearchParams(applySelectionToQuery(new URLSearchParams(searchParams), next, scope), { replace: true });
  };

  /** Back to wherever the user came from; a cold-opened link falls back to the dashboard. */
  const goBack = () => {
    const cameFromApp = (window.history.state?.idx ?? 0) > 0;
    if (cameFromApp) navigate(-1);
    else navigate(DASHBOARD_PATH, { replace: true });
  };

  const metricLabel = historicalMetricLabel(selection.metricCode, selection.variant);
  const showData = !loading && !failed && vm !== null;
  // The frame is the same whatever happens: real VM when loaded, else the selection's column model.
  const grid = showData ? vm : placeholderGrid(selection.comparison, vm?.anchorYear ?? new Date().getFullYear());

  return (
    <div className="hd-page">
      <div className="hd-header">
        {isDesktop ? (
          <nav className="hd-breadcrumb" aria-label={t('insights.teamDrilldown.breadcrumb')}>
            <Link to={DASHBOARD_PATH}>{t('insights.dashboard.title')}</Link>
            {/* Figma 9:11307: the separator is a ">" text glyph, not an icon. */}
            <span className="hd-crumb-sep" aria-hidden="true">&gt;</span>
            <span aria-current="page">{t('insights.history.title')}</span>
          </nav>
        ) : (
          <button type="button" className="hd-back" onClick={goBack}>
            <Icon token="arrow-back" size={24} tone="var(--color-icon)" />
            <span>{t('insights.common.back')}</span>
          </button>
        )}
        {vm && <span className="hd-asof">{formatDateAsOfNumeric(vm.meta.asOfDate)}</span>}
      </div>

      <div className="hd-titlebar">
        <h1 className="hd-title">{t('insights.history.title')}</h1>
        <div className="hd-actions">
          <FilterButton
            label={t('insights.historicalData.filter.open')}
            disabled={!vm}
            onClick={() => setSheetOpen(true)}
          />
          {/* Download (ARVIJ-1450-SP02): needs the VM of what is displayed, so it waits for a settled load. */}
          <DownloadButton
            label={t('insights.historicalData.download.open')}
            disabled={!showData}
            onClick={() => setDownloadOpen(true)}
          />
        </div>
      </div>

      <ul className="hd-chips" tabIndex={0} aria-label={t('insights.filter.title')}>
        <li className="hd-chip">
          <span className="hd-chip-label">{t('insights.historicalData.chip.time')}</span>
          <strong className="hd-chip-value">{historicalComparisonLabel(selection.comparison)}</strong>
        </li>
        <li className="hd-chip">
          <span className="hd-chip-label">{t('insights.historicalData.chip.metric')}</span>
          <strong className="hd-chip-value">{metricLabel}</strong>
        </li>
      </ul>

      {failed && !loading && (
        <div className="notice warning hd-banner" role="alert">
          <span>{t('insights.historicalData.state.error')}</span>
          <button type="button" className="btn-outline hd-retry" onClick={() => void load()}>
            {t('insights.historicalData.state.retry')}
          </button>
        </div>
      )}
      {showData && vm.dataState === 'EMPTY' && (
        <div className="notice info hd-banner" role="status">
          <span>{t('insights.historicalData.state.empty')}</span>
        </div>
      )}

      <div aria-busy={loading}>
        {loading ? <HistoricalSkeleton desktop={isDesktop} /> : isDesktop
          ? <HistoricalTable grid={grid} title={metricLabel} />
          : <HistoricalCards grid={grid} label={metricLabel} />}
      </div>

      {downloadOpen && showData && (
        <HistoricalDownloadSheet vm={vm} query={query} scope={scope} onClose={() => setDownloadOpen(false)} />
      )}

      {sheetOpen && vm && (
        <HistoricalFilterSheet
          filter={vm.filter}
          selection={selection}
          onApply={applySelection}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}
