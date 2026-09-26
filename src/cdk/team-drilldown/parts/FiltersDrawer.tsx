import { useMemo, useState } from "react";
import { CheckRow, Drawer, RadioRows } from "@/dls-stub";
import { t } from "@/lib/i18n";
import type { MemberBadgeCode, TeamDrilldownFilterOptionsVM, TeamDrilldownSortBy } from "@spec/performance-vm";

/**
 * w.team-drilldown.filters (S-P4-07 0.2.0 §3.4, AC-P4-07-12). Selections are
 * staged locally and applied only on Confirm; Cancel/close/backdrop/Escape
 * discard. An empty or complete badge selection means "All Agent" (no
 * `badges` param).
 */
export function FiltersDrawer({
  options,
  sortBy,
  badges,
  onApply,
  onClose,
}: {
  options: TeamDrilldownFilterOptionsVM;
  sortBy: TeamDrilldownSortBy;
  /** Applied selection; empty = All Agent. */
  badges: MemberBadgeCode[];
  onApply: (next: { sortBy: TeamDrilldownSortBy; badges: MemberBadgeCode[] }) => void;
  onClose: () => void;
}) {
  const all = useMemo(() => options.badgeGroups.flatMap((g) => g.badges), [options]);
  const [stagedSort, setStagedSort] = useState<TeamDrilldownSortBy>(sortBy);
  const [selected, setSelected] = useState<Set<MemberBadgeCode>>(
    () => new Set(badges.length ? badges : all),
  );

  const allChecked = all.every((b) => selected.has(b));
  const toggle = (codes: MemberBadgeCode[], on: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const code of codes) {
        if (on) next.add(code);
        else next.delete(code);
      }
      return next;
    });
  };

  const confirm = () => {
    const chosen = all.filter((b) => selected.has(b));
    onApply({
      sortBy: stagedSort,
      badges: chosen.length === 0 || chosen.length === all.length ? [] : chosen,
    });
  };

  return (
    <Drawer
      className="td-filters"
      title={t("insights.teamDrilldown.filters.title")}
      closeLabel={t("insights.common.close")}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="td-btn-outline" onClick={onClose}>
            {t("insights.common.cancel")}
          </button>
          <button type="button" className="td-btn-primary" onClick={confirm}>
            {t("insights.common.confirm")}
          </button>
        </>
      }
    >
      <section className="td-filter-card">
        <h3>{t("insights.teamDrilldown.sortBy.label")}</h3>
        <RadioRows
          className="td-filter-options"
          value={stagedSort}
          options={options.sortBy}
          onChange={setStagedSort}
          label={(code) => t(`insights.metric.${code}.title`)}
        />
      </section>
      <div className="td-filter-master">
        <CheckRow
          strong
          checked={allChecked}
          label={t("insights.teamDrilldown.allAgent")}
          onChange={() => toggle(all, !allChecked)}
        />
      </div>
      {options.badgeGroups.map((group) => {
        const groupOn = group.badges.some((b) => selected.has(b));
        const single = group.badges.length === 1 && group.badges[0] === group.groupCode;
        return (
          <section key={group.groupCode} className="td-filter-card">
            <CheckRow
              strong
              checked={groupOn}
              label={t(`insights.teamDrilldown.badgeGroup.${group.groupCode}`)}
              onChange={() => toggle(group.badges, !groupOn)}
            />
            {!single && (
              <div className="td-filter-options">
                {group.badges.map((code) => (
                  <CheckRow
                    key={code}
                    checked={selected.has(code)}
                    label={t(`insights.teamDrilldown.badge.${code}`)}
                    onChange={() => toggle([code], !selected.has(code))}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </Drawer>
  );
}
