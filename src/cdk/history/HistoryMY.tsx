import HistoricalData from './HistoricalData';
import { parseHistoricalScope } from '@/lib/historical-data';

/**
 * S-P4-03 Historical Data (ARVIJ-1450). One screen for every persona: SELF
 * (no `scope` param, the agent's own numbers) and TEAM (`?scope=TEAM`, opened
 * from the Team dashboard) share the same month-card / table layout, chips and
 * Filter & Selection sheet; only the BFF request differs. The pre-ARVIJ-1450
 * pills + window-pager table is gone. Keyed by scope so switching scope never
 * shows the other scope's data or filter options.
 */
export default function HistoryMY({ query }: { query: Record<string, string | undefined> }) {
  const scope = parseHistoricalScope(query);
  return <HistoricalData key={scope} scope={scope} query={query} />;
}
