import { useEffect, useRef, useState } from "react";
import { Drawer, SearchField } from "@/dls-stub";
import { StateProcessing } from "@/components/ui";
import { apiFetch } from "@/lib/apiClient";
import { t } from "@/lib/i18n";
import type { TeamDrilldownSortBy, TeamDrilldownVM, TeamMemberVM } from "@spec/performance-vm";
import { MemberCard } from "./MemberCard";

/**
 * w.team-drilldown.subteam-drawer (S-P4-07 0.2.0 §3.4, AC-P4-07-13): a
 * member-leader's direct reports (`parentAgentId`), with search scoped to the
 * subteam. Cards keep the main list's face and open viewing mode on tap.
 */
export function SubteamDrawer({
  parent,
  sortBy,
  onClose,
}: {
  parent: TeamMemberVM;
  sortBy: TeamDrilldownSortBy;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [vm, setVm] = useState<TeamDrilldownVM | null>(null);
  const [failed, setFailed] = useState(false);
  const seq = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setQuery(search.trim()), 260);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const current = ++seq.current;
    const qs = new URLSearchParams({ parentAgentId: parent.agentId, sortBy });
    if (query) qs.set("query", query);
    void apiFetch(`/api/bff/v1/performance/team-drilldown?${qs}`)
      .then(async (res) => {
        if (current !== seq.current) return;
        if (!res.ok) { setFailed(true); return; }
        setFailed(false);
        setVm((await res.json()) as TeamDrilldownVM);
      })
      .catch(() => { if (current === seq.current) setFailed(true); });
  }, [parent.agentId, sortBy, query]);

  const head = vm?.parent ?? parent;
  return (
    <Drawer
      className="td-subteam"
      title={t("insights.teamDrilldown.subteamTitle", {
        name: head.displayName,
        count: String(head.directReportCount ?? vm?.members.length ?? 0),
      })}
      closeLabel={t("insights.common.close")}
      onClose={onClose}
    >
      <SearchField
        className="td-search"
        value={search}
        onChange={setSearch}
        placeholder={t("insights.teamDrilldown.searchPlaceholder")}
      />
      {failed && <p className="td-empty">{t("insights.notice.generic")}</p>}
      {!failed && !vm && <StateProcessing onRefresh={() => setQuery((q) => q)} />}
      {vm && vm.members.length === 0 && <p className="td-empty">{t("insights.teamDrilldown.emptySearch")}</p>}
      {vm && vm.members.length > 0 && (
        <div className="td-subteam-list">
          {vm.members.map((member) => (
            <MemberCard key={member.agentId} member={member} />
          ))}
        </div>
      )}
    </Drawer>
  );
}
