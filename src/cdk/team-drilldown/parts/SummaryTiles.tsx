import { formatScalarCompact } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { TeamDrilldownSummaryTileVM } from "@spec/performance-vm";

/**
 * w.team-drilldown.summary-tile row (S-P4-07 0.2.0, AC-P4-07-10): BFF order,
 * compact values with the currency prefix kept (D-P4-07-05); a tile without a
 * value shows the no-value placeholder, never a zero.
 */
export function SummaryTiles({ tiles }: { tiles: TeamDrilldownSummaryTileVM[] }) {
  return (
    <div className="td-kpis" role="list">
      {tiles.map((tile) => (
        <div key={tile.metricCode} className="td-kpi" role="listitem">
          <span className="td-kpi-label">{t(`insights.teamDrilldown.summary.${tile.metricCode}`)}</span>
          <span className="td-kpi-value">{formatScalarCompact(tile.value, true)}</span>
        </div>
      ))}
    </div>
  );
}
