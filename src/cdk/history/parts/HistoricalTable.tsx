import { useId } from 'react';
import { formatScalar } from '@/lib/format';
import { t } from '@/lib/i18n';
import { changeHeader, totalChangeCell, type HistoricalGrid } from '@/lib/historical-data';
import { ChangeCell, TotalChangeText } from './ChangePill';

/**
 * Desktop (>= 1024px) view of the Historical Data grid (Figma 9:11300): a card
 * titled with the selected metric holding one table — Month, one column per
 * year, one per change basis ("MoM % Change" for Current Year, "% Change vs LY"
 * / "% Change vs L2Y" otherwise). Values keep the currency prefix ("RM 25,246",
 * unlike the mobile cards). When the BFF sends `totals` (additive metrics only)
 * a bold Total row closes the table; its change cells are bold toned text with
 * no pill background, "N/A" when null, and EMPTY in a LAST_MONTH column
 * (AC-P4-03-32). Month is a sticky row header so the table stays readable if
 * the region scrolls sideways.
 */
export function HistoricalTable({ grid, title }: { grid: HistoricalGrid; title: string }) {
  const titleId = useId();
  const { totals } = grid;
  return (
    <div className="hd-table-card">
      <h2 id={titleId} className="hd-table-title">{title}</h2>
      <div className="hd-table-scroll" role="region" aria-labelledby={titleId} tabIndex={0}>
        <table className="hd-table" aria-labelledby={titleId}>
          <thead>
            <tr>
              <th scope="col">{t('insights.history.month')}</th>
              {grid.years.map((year) => <th key={year} scope="col">{year}</th>)}
              {grid.changeColumns.map((column, i) => (
                <th key={`change-${i}`} scope="col">{changeHeader(column.basis)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.rows.map((row) => (
              <tr key={row.month}>
                <th scope="row">{t(`insights.month.${row.month}.short`)}</th>
                {grid.years.map((year, i) => <td key={year}>{formatScalar(row.values[i])}</td>)}
                {grid.changeColumns.map((_, i) => (
                  <td key={`change-${i}`}><ChangeCell delta={row.changes[i]} /></td>
                ))}
              </tr>
            ))}
          </tbody>
          {totals && (
            <tfoot>
              <tr>
                <th scope="row">{t('insights.historicalData.total')}</th>
                {grid.years.map((year, i) => <td key={year}>{formatScalar(totals.values[i])}</td>)}
                {grid.changeColumns.map((column, i) => (
                  <td key={`change-${i}`}>
                    {totalChangeCell(column.basis, totals.changes[i]) === 'empty' ? null : <TotalChangeText delta={totals.changes[i]} />}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
