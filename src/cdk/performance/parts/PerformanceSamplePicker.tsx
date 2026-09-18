import { t } from '@/lib/i18n';
import { getPerformanceSample, PERFORMANCE_SAMPLES, selectPerformanceSample } from '@/lib/performanceMock';

/** Explicit development data selection; never changes the data or backend permissions. */
export function PerformanceSamplePicker() {
  const current = getPerformanceSample();
  if (!current) return null;
  return (
    <span className="persona">
      <select
        aria-label={t('insights.dev.sample.label')}
        value={current.id}
        onChange={event => {
          selectPerformanceSample(event.target.value);
          // Match the existing dev persona picker: reset page state and all filters.
          window.location.assign('/insights/performance');
        }}
      >
        {PERFORMANCE_SAMPLES.map(sample => (
          <option key={sample.id} value={sample.id}>
            {t(`insights.dev.sample.${sample.kind.toLowerCase()}`)}
          </option>
        ))}
      </select>
    </span>
  );
}