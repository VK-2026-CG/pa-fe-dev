import { useEffect, useId, useRef, useState } from 'react';
import { Drawer, RadioRows } from '@/dls-stub';
import { apiFetch } from '@/lib/apiClient';
import {
  ALL_METRICS_CONCURRENCY, MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, allMetricQueries, buildPdfModel,
  downloadFileName, mapLimit, validateDownloadPassword, type DownloadMode,
} from '@/lib/historical-download';
import { isHistoricalDataVM, type HistoricalQuery } from '@/lib/historical-data';
import { t } from '@/lib/i18n';
import type { HistoricalDataVM, Scope } from '@spec/performance-vm';

/** Hand the file to the browser: an object URL on a temporary anchor, revoked right after the click. */
function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * "Download" sheet of the Historical Data screen (S-P4-03 §D, AC-P4-03-36…-39): Selected Metric (default) or All
 * Metrics, a masked password (min 6 characters) and one primary Download. Selected Metric reuses the VM the page
 * already holds (exactly what is displayed); All Metrics asks the BFF once per metric/variant of the scope's
 * filter list for the applied comparison (3 at a time) — if any request fails the whole download fails. The
 * password lives only in this component's state and the PDF call: never logged, stored, sent or put in a URL, and
 * gone when the sheet closes. Success saves the file and closes; failure keeps the entry and allows a retry.
 */
export function HistoricalDownloadSheet({
  vm,
  query,
  scope,
  onClose,
}: {
  /** The loaded VM of the applied selection (what the page shows). */
  vm: HistoricalDataVM;
  query: HistoricalQuery;
  scope: Scope;
  onClose: () => void;
}) {
  const modeHeadingId = useId();
  const passwordId = useId();
  const hintId = useId();
  const errorId = useId();
  const [mode, setMode] = useState<DownloadMode>('SELECTED');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [failed, setFailed] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      // Closing mid-generation abandons it: no state updates, no file, no more requests.
      alive.current = false;
      abort.current?.abort();
    };
  }, []);

  const comparison = vm.selection.comparison;
  const check = validateDownloadPassword(password);
  const showError = touched && !check.ok;

  const fetchVm = async (params: URLSearchParams, signal: AbortSignal): Promise<HistoricalDataVM> => {
    const res = await apiFetch(`/api/bff/v1/performance/historical-data?${params}`, { signal });
    if (!res.ok) throw new Error('request failed');
    const body: unknown = await res.json();
    if (!isHistoricalDataVM(body)) throw new Error('unexpected payload');
    return body;
  };

  const submit = async () => {
    if (generating) return;
    setTouched(true);
    if (!check.ok) {
      passwordRef.current?.focus();
      return;
    }
    setFailed(false);
    setGenerating(true);
    const controller = new AbortController();
    abort.current = controller;
    try {
      const vms = mode === 'SELECTED'
        ? [vm]
        : await mapLimit(allMetricQueries(vm.filter.metrics, query, comparison, scope), ALL_METRICS_CONCURRENCY, (params) => fetchVm(params, controller.signal));
      const now = new Date();
      const { createHistoricalPdf } = await import('@/lib/historical-pdf');
      const blob = await createHistoricalPdf(buildPdfModel(vms, scope, comparison, now), password);
      if (!alive.current) return;
      saveBlob(blob, downloadFileName(mode, comparison, now));
      setPassword('');
      onClose();
    } catch {
      // Deliberately silent: an error object could carry request details, and nothing here may log the password.
      if (alive.current) setFailed(true);
    } finally {
      if (alive.current) setGenerating(false);
    }
  };

  return (
    <Drawer
      className="hd-filters hd-download"
      title={t('insights.historicalData.download.title')}
      closeLabel={t('insights.common.close')}
      onClose={onClose}
      footer={(
        <button type="button" className="hd-btn-primary" disabled={generating} onClick={() => void submit()}>
          {generating ? t('insights.historicalData.download.generating') : t('insights.historicalData.download.submit')}
        </button>
      )}
    >
      <section className="hd-filter-card">
        <h3 id={modeHeadingId} className="sr-only">{t('insights.historicalData.download.title')}</h3>
        <RadioRows
          className="hd-filter-options"
          labelledBy={modeHeadingId}
          value={mode}
          options={['SELECTED', 'ALL'] as DownloadMode[]}
          onChange={setMode}
          label={(option) => t(option === 'ALL' ? 'insights.historicalData.download.allMetrics' : 'insights.historicalData.download.selectedMetric')}
        />
      </section>
      <section className="hd-filter-card hd-field">
        <label className="hd-field-label" htmlFor={passwordId}>{t('insights.historicalData.download.password')}</label>
        <input
          ref={passwordRef}
          id={passwordId}
          className="hd-input"
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          maxLength={MAX_PASSWORD_LENGTH}
          required
          aria-required="true"
          aria-invalid={showError}
          aria-describedby={showError ? `${hintId} ${errorId}` : hintId}
          value={password}
          disabled={generating}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => { if (password) setTouched(true); }}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void submit(); } }}
        />
        <p id={hintId} className="hd-field-hint">{t('insights.historicalData.download.passwordHint')}</p>
        {showError && (
          <p id={errorId} className="hd-field-error" role="alert">
            {t('insights.historicalData.download.passwordTooShort', { min: MIN_PASSWORD_LENGTH })}
          </p>
        )}
      </section>
      {failed && (
        <div className="notice warning" role="alert">
          <span>{t('insights.historicalData.download.failed')}</span>
        </div>
      )}
    </Drawer>
  );
}
