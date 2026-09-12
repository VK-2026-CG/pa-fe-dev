import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { href } from '@/lib/nav';
import { formatDateAsOf } from '@/lib/format';
import { apiFetch } from '@/lib/apiClient';
import {
  BarComparison, BreakdownTable, ComparisonCard, GaugeDonut, PendersCard,
  ThresholdArc, VariantValueCard, comparisonLabelKey,
} from '@/components/metrics';
import { NoticeBanner, StateEmpty, StateProcessing } from '@/components/ui';
import { Icon, Tag } from '@/dls-stub';
import type { MetricDetailVM } from '@spec/performance-vm';

export default function MetricDetailMY({ query }: { query: Record<string, string | undefined> }) {
  const navigate = useNavigate();
  const [vm, setVm] = useState<MetricDetailVM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const metricCode = query.metricCode ?? 'TPC';

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    for (const k of ['period', 'businessLine', 'basis', 'scope', 'teamView'] as const) {
      if (query[k]) params.set(k, query[k]!);
    }
    const res = await apiFetch(`/api/bff/v1/performance/metrics/${metricCode}?${params}`);
    if (!res.ok) { setError(String(res.status)); return; }
    setError(null);
    setVm(await res.json());
  }, [metricCode, query]);

  useEffect(() => { void load(); }, [load]);

  if (error) return <div className="section card pad">Error {error}</div>;
  if (!vm) return <div className="section muted">Loading…</div>;
  const c = vm.context;

  return (
    <>
      <div className="appbar">
        <button className="back" aria-label="Back" onClick={() => navigate(-1)}>←</button>
        <h1>{t(`insights.metric.${metricCode}.title`)}</h1>
      </div>
      {/* Context strip — Tag chips h28 + as-of Tag right (Figma 6588:18606) */}
      <div className="section spread">
        <span className="row">
          {c.teamView && <Tag>{t(`insights.teamView.${c.teamView}`)}</Tag>}
          <Tag>{c.businessLine === 'ALL' ? t('insights.businessLine.ALL.chip') : t(`insights.businessLine.${c.businessLine}`)}</Tag>
          <Tag>{t(`insights.period.${c.period}`)}</Tag>
        </span>
        <Tag tone="muted">{formatDateAsOf(c.asOfDate)}</Tag>
      </div>

      {vm.dataState === 'PROCESSING' && <div className="section"><StateProcessing onRefresh={() => { setVm(null); void load(); }} /></div>}
      {vm.dataState === 'EMPTY' && <div className="section"><StateEmpty metricCode={metricCode} /></div>}

      {vm.dataState === 'OK' && (
        <>
          {vm.notices?.map((n) => <div className="section" key={n.code}><NoticeBanner notice={n} /></div>)}
          {vm.sections.map((s) => {
            switch (s.type) {
              case 'GAUGE': return <div className="section" key={s.id}><GaugeDonut s={s} metricCode={metricCode} /></div>;
              case 'THRESHOLD_GAUGE': return <div className="section" key={s.id}><ThresholdArc s={s} metricCode={metricCode} /></div>;
              case 'BAR_COMPARISON': return <div className="section" key={s.id}><BarComparison s={s} metricCode={metricCode} /></div>;
              case 'COMPARISON': return <div className="section" key={s.id}><ComparisonCard s={s} metricCode={metricCode} labelKey={comparisonLabelKey(metricCode, s.change.display)} /></div>;
              case 'VARIANT_VALUE': return <div className="section" key={s.id}><VariantValueCard s={s} metricCode={metricCode} /></div>;
              case 'PENDERS': return <div className="section" key={s.id}><PendersCard s={s} /></div>;
              case 'BREAKDOWN': return <div className="section" key={s.id}><BreakdownTable s={s} metricCode={metricCode} /></div>;
              default: return null; // unknown section type — skip (AC-P4-02-07)
            }
          })}
          {vm.historyNav && (
            <div className="section">
              <Link className="footer-link" to={href(vm.historyNav)}>
                <Icon token="sheet.HISTORICAL_DATA" size={20} tone="var(--color-brand)" />
                <span style={{ flex: 1 }}>{t('insights.history.title')}</span>
                <Icon token="arrow-right-s" size={20} tone="var(--color-text-muted)" />
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
