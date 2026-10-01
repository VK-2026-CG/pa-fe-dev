import { useId, useState } from 'react';
import { Drawer, RadioRows } from '@/dls-stub';
import { t } from '@/lib/i18n';
import {
  historicalComparisonOptionLabel, historicalMetricLabel, metricFromOptionId, metricOptionId,
  type HistoricalSelection,
} from '@/lib/historical-data';
import type { HistoricalComparison, HistoricalDataVM } from '@spec/performance-vm';

/**
 * "Filter & Selection" sheet of the Team Historical Data screen (AC-P4-03-16
 * / -17): a Time radio group and a Metric radio group, both fed by the VM's
 * `filter` options (config order), and one primary Apply. Choices are staged
 * locally — Apply hands the selection to the page, closing (X, backdrop,
 * Escape) discards it. Bottom sheet below 768px, right drawer above.
 */
export function HistoricalFilterSheet({
  filter,
  selection,
  onApply,
  onClose,
}: {
  filter: HistoricalDataVM['filter'];
  /** The applied selection — what the sheet opens on. */
  selection: HistoricalSelection;
  onApply: (next: HistoricalSelection) => void;
  onClose: () => void;
}) {
  const timeHeadingId = useId();
  const metricHeadingId = useId();
  const metricIds = filter.metrics.map((m) => metricOptionId(m.metricCode, m.variant));
  const comparisons = filter.comparisons.map((c) => c.comparison);

  const [metricId, setMetricId] = useState(() => {
    const applied = metricOptionId(selection.metricCode, selection.variant);
    const flagged = filter.metrics.find((m) => m.selected);
    return metricIds.includes(applied) ? applied
      : flagged ? metricOptionId(flagged.metricCode, flagged.variant) : (metricIds[0] ?? applied);
  });
  const [comparison, setComparison] = useState<HistoricalComparison>(() =>
    comparisons.includes(selection.comparison) ? selection.comparison
      : (filter.comparisons.find((c) => c.selected)?.comparison ?? comparisons[0] ?? selection.comparison));

  return (
    <Drawer
      className="hd-filters"
      title={t('insights.filter.title')}
      closeLabel={t('insights.common.close')}
      onClose={onClose}
      footer={(
        <button
          type="button"
          className="hd-btn-primary"
          onClick={() => onApply({ ...metricFromOptionId(metricId), comparison })}
        >
          {t('insights.common.apply')}
        </button>
      )}
    >
      <section className="hd-filter-card">
        <h3 id={timeHeadingId}>{t('insights.historicalData.filter.time')}</h3>
        <RadioRows
          className="hd-filter-options"
          labelledBy={timeHeadingId}
          value={comparison}
          options={comparisons}
          onChange={setComparison}
          label={historicalComparisonOptionLabel}
        />
      </section>
      <section className="hd-filter-card">
        <h3 id={metricHeadingId}>{t('insights.historicalData.filter.metric')}</h3>
        <RadioRows
          className="hd-filter-options"
          labelledBy={metricHeadingId}
          value={metricId}
          options={metricIds}
          onChange={setMetricId}
          label={(id) => {
            const m = metricFromOptionId(id);
            return historicalMetricLabel(m.metricCode, m.variant);
          }}
        />
      </section>
    </Drawer>
  );
}
