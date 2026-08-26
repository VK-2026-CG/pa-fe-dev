'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { formatScalar } from '@/lib/format';
import { DeltaBadge } from '@/components/ui';
import { Icon } from '@/dls-stub';
import type { HistoryWindow, MetricHistoryVM } from '@spec/performance-vm';

export default function HistoryMY({ query }: { query: Record<string, string | undefined> }) {
  const router = useRouter();
  const [vm, setVm] = useState<MetricHistoryVM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const metricCode = query.metricCode ?? 'TPC';
  const window = (query.window ?? 'VS_LAST_2_YEARS') as HistoryWindow;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ window });
    for (const k of ['businessLine', 'basis', 'scope', 'teamView'] as const) {
      if (query[k]) params.set(k, query[k]!);
    }
    const res = await fetch(`/api/bff/v1/performance/metrics/${metricCode}/history?${params}`);
    if (!res.ok) { setError(String(res.status)); return; }
    setError(null);
    setVm(await res.json());
  }, [metricCode, window, query]);

  useEffect(() => { void load(); }, [load]);

  const go = (patch: { metricCode?: string; window?: HistoryWindow }) => {
    const params = new URLSearchParams();
    params.set('metricCode', patch.metricCode ?? metricCode);
    params.set('window', patch.window ?? window);
    for (const k of ['businessLine', 'basis', 'scope', 'teamView'] as const) {
      if (query[k]) params.set(k, query[k]!);
    }
    router.push(`/insights/history?${params.toString()}`);
  };

  if (error) return <div className="section card pad">Error {error}</div>;
  if (!vm) return <div className="section muted">Loading…</div>;

  const cmp = vm.comparison;
  const windowIdx = cmp.windowOptions.indexOf(cmp.window);
  const older = cmp.windowOptions[windowIdx + 1];
  const newer = cmp.windowOptions[windowIdx - 1];

  return (
    <>
      <div className="appbar">
        <button className="back" aria-label="Back" onClick={() => router.back()}>←</button>
        <h1>{t('insights.history.title')}</h1>
      </div>

      {/* Metric pills h32, one horizontally-scrollable strip (Figma 6588:17265) */}
      <div className="section">
        <div className="pillrow" role="tablist">
          {[...vm.tabs, ...vm.moreTabs].map((tab) => (
            <button key={tab.metricCode} role="tab" aria-selected={tab.selected}
              className={`pill ${tab.selected ? 'active' : ''}`}
              onClick={() => go({ metricCode: tab.metricCode })}>
              {t(`insights.metric.${tab.metricCode}.title`)}
            </button>
          ))}
        </div>
      </div>

      <div className="section spread">
        <button className="pager-btn" aria-label="Older window" disabled={!cmp.canGoOlder}
          onClick={() => older && go({ window: older })}><Icon token="arrow-left-s" size={16} tone="var(--color-text)" /></button>
        <span className="title14">{t(`insights.history.window.${cmp.window}`)}</span>
        <button className="pager-btn" aria-label="Newer window" disabled={!cmp.canGoNewer}
          onClick={() => newer && go({ window: newer })}><Icon token="arrow-right-s" size={16} tone="var(--color-text)" /></button>
      </div>

      <div className="section card pad" style={{ paddingTop: 4, paddingBottom: 4 }}>
        <div className="scroll-x">
        <table className="table history-table">
          <thead>
            <tr>
              <th className="history-month">{t('insights.history.month')}</th>
              {vm.years.map((y) => <th key={y} className="num history-year">{y}</th>)}
              {vm.momDeltas && (
                <th className="num history-mom">
                  {vm.valueType === 'MONEY' ? t('insights.history.momPctChange') : t('insights.history.momDelta')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {vm.rows.map((r) => (
              <tr key={r.month}>
                <td className="history-month">{t(`insights.month.${r.month}.short`)}</td>
                {r.values.map((v, i) => (
                  <td key={i} className="num history-year">{v === null ? '-' : formatScalar(v)}</td>
                ))}
                {vm.momDeltas && (
                  <td className="num history-mom">
                    {vm.momDeltas[r.month - 1] == null
                      ? <span className="muted">{t('insights.common.na')}</span>
                      : <DeltaBadge delta={vm.momDeltas[r.month - 1]!} />}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
