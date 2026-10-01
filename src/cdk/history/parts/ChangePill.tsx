import { Tag } from '@/dls-stub';
import { formatHistoricalChange, isRenderableChange } from '@/lib/historical-data';
import { toneFor } from '@/lib/format';
import { t } from '@/lib/i18n';
import type { DeltaVM } from '@spec/performance-vm';

/**
 * One change cell of the Team Historical Data grid (card row or table cell):
 * a coloured pill — green for an increase, red for a decrease, neutral for
 * "0%" — or a muted "N/A" when the BFF sent `null` (AC-P4-03-25). Tone comes
 * from the VM's `sentiment`; the pill never infers it from the sign.
 */
export function ChangeCell({ delta }: { delta: DeltaVM | null | undefined }) {
  if (!isRenderableChange(delta)) return <span className="hd-na">{t('insights.common.na')}</span>;
  return <Tag tone={toneFor(delta.sentiment)} className="hd-pill">{formatHistoricalChange(delta)}</Tag>;
}

/**
 * Total-row change cell (desktop, AC-P4-03-32): the same toned value as a
 * month row's pill, but as bold coloured text without the pill background
 * (requester's desktop image). Tone from the VM `sentiment`; "N/A" when null.
 */
export function TotalChangeText({ delta }: { delta: DeltaVM | null | undefined }) {
  if (!isRenderableChange(delta)) return <span className="hd-na">{t('insights.common.na')}</span>;
  return <span className={`hd-total-change hd-tone-${toneFor(delta.sentiment)}`}>{formatHistoricalChange(delta)}</span>;
}
