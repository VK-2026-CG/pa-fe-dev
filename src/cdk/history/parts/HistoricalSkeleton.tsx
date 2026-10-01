/**
 * Loading placeholder for the Team Historical Data grid: twelve month cards
 * on mobile/tablet, a framed table on desktop. Decorative only — the parent
 * region carries `aria-busy`.
 */
export function HistoricalSkeleton({ desktop }: { desktop: boolean }) {
  const months = Array.from({ length: 12 }, (_, i) => i);
  if (desktop) {
    return (
      <div className="hd-table-card hd-skel" aria-hidden>
        <span className="hd-skel-bar hd-skel-title" />
        {months.map((m) => <span key={m} className="hd-skel-bar hd-skel-row" />)}
      </div>
    );
  }
  return (
    <div className="hd-cards hd-skel" aria-hidden>
      {months.map((m) => (
        <div key={m} className="hd-card">
          <span className="hd-skel-bar hd-skel-short" />
          <span className="hd-skel-bar hd-skel-long" />
          <span className="hd-skel-bar hd-skel-mid" />
        </div>
      ))}
    </div>
  );
}
