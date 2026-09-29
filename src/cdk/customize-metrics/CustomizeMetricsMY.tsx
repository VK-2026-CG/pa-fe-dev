/**
 * Customize Metrics (S-P4-04) — white sheet with rounded pill rows.
 * Priority rows are locked + reorderable (drag, or ArrowUp/ArrowDown on the
 * grip); focus rows are tap-to-select. Save stays explicit (contract PUT).
 * Visual reference is a screenshot, not Figma metadata — see
 * docs/design/figma-measurements.md.
 */
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { t } from '@/lib/i18n';
import { apiFetch } from '@/lib/apiClient';
import { Toast } from '@/components/ui';
import {
  CustomizeActions, CustomizeHeader, CustomizeMetricRow, CustomizeScrollArea, CustomizeSection,
  CustomizeSurface, DragHandle, SelectionBox,
} from '@/dls-stub';
import type { CustomizeItemVM, CustomizeMetricsVM, Scope } from '@spec/performance-vm';

/** "TPC without repricing" — title + variant, both from the vendored bundle. */
function metricLabel(item: CustomizeItemVM): string {
  const title = t(`insights.metric.${item.metricCode}.title`);
  if (!item.variant) return title;
  return `${title} ${t(`insights.variant.${item.variant}`).toLowerCase()}`;
}

/**
 * `onClose`/`onSaved` are optional and only supplied by the embedded,
 * in-place overlay call site (S-P4-01 v1.5.15/S-P4-04 v1.5.0, tablet+
 * desktop, rendered directly from `PerformanceMY` — not the router). The
 * standalone routed call site (mobile, and the `insights/customize-metrics`
 * URL as a fallback at every breakpoint) omits them and keeps navigating,
 * unchanged.
 */
export default function CustomizeMetricsMY({
  query,
  onClose: onCloseProp,
  onSaved,
}: {
  query: Record<string, string | undefined>;
  onClose?: () => void;
  onSaved?: () => void;
}) {
  const navigate = useNavigate();
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
    const res = await apiFetch(`/api/bff/v1/performance/customize?scope=${scope}`);
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

  /** Save enabled only when dirty and both list constraints are satisfied (§3). */
  const dirty =
    priority.some((p, i) => p.metricCode !== vm.priority[i]?.metricCode) ||
    focus.some((f, i) => f.metricCode !== vm.focus[i]?.metricCode || f.selected !== vm.focus[i]?.selected);
  const focusSelectedCount = focus.filter((f) => f.selected).length;
  const constraintsSatisfied =
    priority.length >= vm.constraints.priority.min &&
    priority.length <= vm.constraints.priority.max &&
    focusSelectedCount >= vm.constraints.focus.min &&
    focusSelectedCount <= vm.constraints.focus.max;
  const canSave = dirty && constraintsSatisfied;

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
    const res = await apiFetch(`/api/bff/v1/performance/customize?scope=${scope}`, {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      if (onSaved) {
        onSaved();
      } else {
        navigate('/insights/performance?toast=insights.toast.focusMetricsAdded');
      }
    } else {
      setErrorToast(t('insights.customize.saveFailed'));
    }
  };

  /** Close and Cancel both discard — nothing persists without Save. */
  const dismiss = onCloseProp ?? (() => navigate(-1));

  return (
    <CustomizeSurface onClose={dismiss}>
      {errorToast && <Toast message={errorToast} tone="error" onDone={() => setErrorToast(null)} />}

      <CustomizeHeader
        title={t('insights.customize.title')}
        closeLabel={t('insights.customize.close')}
        onClose={dismiss}
      />

      <CustomizeScrollArea>
        <CustomizeSection
          title={t('insights.customize.priorityHeading')}
          description=""
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
          description=""
        >
          {focus.map((item, i) => (
            <CustomizeMetricRow key={item.metricCode} selected={item.selected}>
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
      </CustomizeScrollArea>

      <CustomizeActions>
        <button className="btn-outline" onClick={dismiss}>{t('insights.customize.cancel')}</button>
        <button className="btn-primary" disabled={saving || !canSave} onClick={save}>
          {t('insights.customize.save')}
        </button>
      </CustomizeActions>
    </CustomizeSurface>
  );
}
