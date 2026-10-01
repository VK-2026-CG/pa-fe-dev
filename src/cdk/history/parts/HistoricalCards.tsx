import { t } from '@/lib/i18n';
import { changeCaption, formatHistoricalValue, type HistoricalGrid } from '@/lib/historical-data';
import { ChangeCell } from './ChangePill';

/**
 * Mobile + tablet view of the Team Historical Data grid (Figma 9:11700): one
 * card per month — year label over its value, a hairline, then one change
 * pill per change column captioned "vs last month" (Current Year) or "vs 2025" / "vs 2024" (the same month of that year).
 * A card keeps its change row (muted "N/A") even when there is nothing to
 * compare, so the layout never changes height with the data (AC-P4-03-25).
 */
export function HistoricalCards({ grid, label }: { grid: HistoricalGrid; label: string }) {
  return (
    <ol className="hd-cards" aria-label={label}>
      {grid.rows.map((row) => (
        <li key={row.month} className="hd-card">
          <h2 className="hd-card-month">{t(`insights.month.${row.month}.long`)}</h2>
          <dl className="hd-card-values">
            {grid.years.map((year, i) => (
              <div key={year} className="hd-card-value">
                <dt>{year}</dt>
                <dd>{formatHistoricalValue(row.values[i])}</dd>
              </div>
            ))}
          </dl>
          <hr className="hairline hd-card-rule" />
          <div className="hd-card-changes">
            {grid.changeColumns.map((column, i) => (
              <span key={i} className="hd-change">
                <ChangeCell delta={row.changes[i]} />
                <span className="hd-change-caption">{changeCaption(column.basis, grid.anchorYear)}</span>
              </span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
