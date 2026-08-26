'use client';
/**
 * Customize Metrics (S-P4-04) — white sheet with rounded pill rows.
 * Priority rows are locked + reorderable (drag, or ArrowUp/ArrowDown on the
 * grip); focus rows are tap-to-select. Save stays explicit (contract PUT).
 * Visual reference is a screenshot, not Figma metadata — see
 * docs/design/figma-measurements.md.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { t } from '@/lib/i18n';
import { Toast } from '@/components/ui';
import {
  CustomizeActions, CustomizeHeader, CustomizeMetricRow, CustomizeSection, CustomizeSurface,
  DragHandle, SelectionBox,
} from '@/dls-stub';
import type { CustomizeItemVM, CustomizeMetricsVM, Scope } from '@spec/performance-vm';

/** "TPC without repricing" — title + variant, both from the vendored bundle. */
function metricLabel(item: CustomizeItemVM): string {
  const title = t(`insights.metric.${item.metricCode}.title`);
  if (!item.variant) return title;
  return `${title} ${t(`insights.variant.${item.variant}`).toLowerCase()}`;
}

export default function CustomizeMetricsMY({ query }: { query: Record<string, string | undefined> }) {
  const router = useRouter();
  const scope = (query.scope === 'TEAM' ? 'TEAM' : 'SELF') as Scope;
  const [vm, setVm] = useState<CustomizeMetricsVM | null>(null);
  const [priority, setPriority] = useState<CustomizeItemVM[]>([]);
  const [focus, setFocus] = useState<CustomizeItemVM[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/bff/v1/performance/customize?scope=${scope}`);
    if (!res.ok) { setError(String(res.status)); return; }
    const data: CustomizeMetricsVM = await res.json();
    setVm(data);
    setPriority(data.priority);
    setFocus(data.focus);
  }, [scope]);

  useEffect(() => { void load(); }, [load]);

  if (error) return <div className="section card pad">Error {error}</div>;
  if (!vm) return <div className="section muted">Loading…</div>;

  const reindex = (list: CustomizeItemVM[]) => list.map((it, k) => ({ ...it, order: k + 1 }));

  const movePriority = (from: number, to: number) => {
    if (to < 0 || to >= priority.length || from === to) return;
    const next = [...priority];
    const [moved] = next.splice(from, 1);
    if (moved) next.splice(to, 0, moved);
    setPriority(reindex(next));
  };

  const toggleFocus = (i: number) => {
    setWarn(null);
    const item = focus[i]!;
    if (!item.selected && focus.filter((f) => f.selected).length >= vm.constraints.focus.max) {
      setWarn(t('insights.customize.maxFocusReached', { max: vm.constraints.focus.max }));
      return;
    }
    setFocus(focus.map((f, k) => (k === i ? { ...f, selected: !f.selected } : f)));
  };

  const save = async () => {
    setSaving(true);
    const body = {
      priorityMetricCodes: priority.map((p) => p.metricCode),
      focusMetricCodes: focus.filter((f) => f.selected).map((f) => f.metricCode),
    };
    const res = await fetch(`/api/bff/v1/performance/customize?scope=${scope}`, {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      router.push('/insights/performance?toast=insights.toast.focusMetricsAdded');
    } else {
      setErrorToast(t('insights.customize.saveFailed'));
    }
  };

  /** Close and Cancel both discard — nothing persists without Save. */
  const dismiss = () => router.back();

  return (
    <CustomizeSurface>
      {errorToast && <Toast message={errorToast} tone="error" onDone={() => setErrorToast(null)} />}

      <CustomizeHeader
        title={t('insights.customize.title')}
        closeLabel={t('insights.customize.close')}
        onClose={dismiss}
      />

      <CustomizeSection
        title={t('insights.customize.priorityHeading')}
        description={t('insights.customize.priorityDescription')}
      >
        {priority.map((item, i) => (
          <CustomizeMetricRow
            key={item.metricCode}
            reorderIndex={i}
            dragging={dragIndex === i}
            dropTarget={overIndex === i && dragIndex !== null && dragIndex !== i}
          >
            <SelectionBox checked={item.selected} disabled={item.locked} label={metricLabel(item)} />
            <span className="lbl">{metricLabel(item)}</span>
            {item.reorderable && (
              <DragHandle
                label={t('insights.customize.reorder', { metric: metricLabel(item) })}
                index={i}
                count={priority.length}
                onMove={movePriority}
                onDragStateChange={(from, over) => { setDragIndex(from); setOverIndex(over); }}
              />
            )}
          </CustomizeMetricRow>
        ))}
      </CustomizeSection>

      <CustomizeSection
        title={t('insights.customize.focusHeading')}
        description={t('insights.customize.focusDescription')}
      >
        {focus.map((item, i) => (
          <CustomizeMetricRow key={item.metricCode}>
            <SelectionBox
              checked={item.selected}
              label={metricLabel(item)}
              onChange={() => toggleFocus(i)}
            />
            <span className="lbl">{metricLabel(item)}</span>
          </CustomizeMetricRow>
        ))}
      </CustomizeSection>

      {warn && <div className="cust-warn" role="status">{warn}</div>}

      <CustomizeActions>
        <button className="btn-outline" onClick={dismiss}>{t('insights.customize.cancel')}</button>
        <button className="btn-primary" disabled={saving} onClick={save}>
          {t('insights.customize.save')}
        </button>
      </CustomizeActions>
    </CustomizeSurface>
  );
}
