'use client';
import { useEffect, useState } from 'react';
import { t } from '@/lib/i18n';
import { toneFor, formatDelta } from '@/lib/format';
import type { DeltaVM, NoticeVM } from '@spec/performance-vm';

export function DeltaBadge({ delta, suffix }: { delta: DeltaVM; suffix?: string }) {
  return <span className={`tag badge-${toneFor(delta.sentiment)}`}>{formatDelta(delta)}{suffix ? ` ${suffix}` : ''}</span>;
}

export function NoticeBanner({ notice }: { notice: NoticeVM }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const key = `insights.notice.${notice.code}`;
  const params: Record<string, string> = {};
  if (notice.params?.productCode) params.product = t(`insights.product.${notice.params.productCode}`);
  const cls = notice.severity === 'WARNING' ? 'warning' : 'info';
  return (
    <div className={`notice ${cls}`} role="status">
      <span aria-hidden>{notice.severity === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
      <span>{t(key, params)}</span>
      <button className="x" aria-label="Dismiss" onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}

export function Toast({ message, tone = 'success', onDone }: { message: string; tone?: 'success' | 'error'; onDone: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, 3200);
    return () => clearTimeout(id);
  }, [onDone]);
  return (
    <div className={`toast ${tone === 'error' ? 'error' : ''}`} role="status">
      <span aria-hidden>{tone === 'error' ? '⚠️' : '✅'}</span>
      <span>{message}</span>
      <button className="x" aria-label="Dismiss" onClick={onDone}>✕</button>
    </div>
  );
}

export function StateProcessing({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div className="state card">
      <div className="glyph" aria-hidden>🫗</div>
      <h3>{t('insights.state.processing.title')}</h3>
      <p className="muted caption">{t('insights.state.processing.body')}</p>
      <button className="btn-outline" onClick={onRefresh}>{t('insights.state.processing.refresh')}</button>
    </div>
  );
}

export function StateEmpty({ metricCode }: { metricCode: string }) {
  return (
    <div className="state card">
      <div className="glyph" aria-hidden>🕊️</div>
      <h3>{t('insights.state.empty.title')}</h3>
      <p className="muted caption">{t('insights.state.empty.body', { metric: t(`insights.metric.${metricCode}.title`) })}</p>
    </div>
  );
}
