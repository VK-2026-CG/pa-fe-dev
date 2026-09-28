import { Link } from "react-router-dom";
import { Avatar, Icon, Tag } from "@/dls-stub";
import { formatScalarCompact } from "@/lib/format";
import { t } from "@/lib/i18n";
import { href } from "@/lib/nav";
import type { MemberBadgeCode, TeamMemberVM } from "@spec/performance-vm";

/** Badge tone per S-P4-07 §3.3: PV/ROOKIE info (blue); MDRT, PruWealth Planner and VIOLET qualification (violet). */
const INFO_BADGES = new Set<MemberBadgeCode>(["PV", "ROOKIE"]);
const QUALIFICATION_BADGES = new Set<MemberBadgeCode>(["MDRT", "COT", "TOT", "WP", "EWP", "SWP", "PWP", "MWP", "VIOLET"]);
function badgeTone(code: MemberBadgeCode): string {
  if (INFO_BADGES.has(code)) return "td-badge-info";
  if (QUALIFICATION_BADGES.has(code)) return "td-badge-qualification";
  return "td-badge-neutral";
}

function GoalStatus({ status }: { status: NonNullable<TeamMemberVM["goalStatus"]> }) {
  return (
    <span className={`td-goal ${status === "SET" ? "set" : "not-set"}`}>
      <Icon
        token={status === "SET" ? "check" : "info"}
        size={20}
        tone={status === "SET" ? "var(--td-goal-set)" : "var(--td-goal-not-set)"}
      />
      <span>{t(`insights.teamDrilldown.goalStatus.${status}`)}</span>
    </span>
  );
}

/**
 * w.team-drilldown.member-card (S-P4-07 0.2.0, AC-P4-07-11). One markup for
 * both breakpoints: the goal status is rendered twice-positioned by CSS
 * (`.td-goal-top` shows ≥1024px, `.td-goal-inline` below) — only one is ever
 * displayed, and the hidden one is removed from the accessibility tree.
 * Absent optional fields drop their element (never synthesized, OQ-79).
 */
export function MemberCard({
  member,
  onOpenSubteam,
}: {
  member: TeamMemberVM;
  onOpenSubteam?: (member: TeamMemberVM) => void;
}) {
  const reports = member.directReportCount ?? 0;
  const role = t(`insights.teamDrilldown.basis.${member.hierarchyBasis}`);
  const card = (
    <>
      {(member.badges?.length || member.goalStatus) && (
        <div className="td-card-top">
          <span className="td-badges">
            {member.badges?.map((code) => (
              <Tag key={code} className={`td-badge ${badgeTone(code)}`}>
                {t(`insights.teamDrilldown.badge.${code}`)}
              </Tag>
            ))}
          </span>
          {member.goalStatus && (
            <span className="td-goal-top">
              <GoalStatus status={member.goalStatus} />
            </span>
          )}
        </div>
      )}
      <div className="td-identity">
        <Avatar name={member.displayName} src={member.photoUrl} className="td-avatar" />
        <span className="td-identity-copy">
          <span className="td-name-line">
            <span className="td-name">{member.displayName}</span>
            <span className="td-role">{role}</span>
            <span className="td-divider td-code-divider-desktop" aria-hidden />
            <span className="td-code td-code-desktop">{member.agentId}</span>
          </span>
          <span className="td-sub-line">
            <span className="td-code">{member.agentId}</span>
            {member.goalStatus && (
              <>
                <span className="td-divider" aria-hidden />
                <span className="td-goal-inline">
                  <GoalStatus status={member.goalStatus} />
                </span>
              </>
            )}
          </span>
        </span>
      </div>
      <div className="td-values">
        <span className="td-value">
          <span className="td-value-label">{t("insights.metric.TPC.title")}</span>
          {formatScalarCompact(member.tpc, false)}
        </span>
        <span className="td-divider" aria-hidden />
        <span className="td-value">
          <span className="td-value-label">{t("insights.metric.PTPC.title")}</span>
          {formatScalarCompact(member.ptpc, false)}
        </span>
      </div>
    </>
  );
  return (
    <article className="td-card">
      {member.nav ? (
        <Link className="td-card-link" to={href(member.nav)} aria-label={`${member.displayName} ${role} ${member.agentId}`}>
          {card}
        </Link>
      ) : (
        <div className="td-card-link">{card}</div>
      )}
      {reports > 0 && onOpenSubteam && (
        <button
          type="button"
          className="td-subteam-btn"
          aria-label={t("insights.teamDrilldown.subteamButton", { name: member.displayName, count: String(reports) })}
          onClick={() => onOpenSubteam(member)}
        >
          <Icon token="scope-team" size={18} tone="var(--td-ink-soft)" />
          <span>{reports}</span>
          <span className="td-caret" aria-hidden />
        </button>
      )}
    </article>
  );
}
