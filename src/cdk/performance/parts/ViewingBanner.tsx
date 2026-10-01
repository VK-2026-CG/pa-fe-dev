import { useNavigate } from "react-router-dom";
import { Icon, ProfileAvatar } from "@/dls-stub";
import { t } from "@/lib/i18n";
import { href } from "@/lib/nav";
import type { DashboardViewingVM } from "@spec/performance-vm";

/**
 * w.dashboard.viewing-banner (S-P4-01 2.1.0, AC-P4-01-85/82): "Viewing {name}"
 * + `{agentId} | {role}`; mobile strip with ✕, desktop card with Exit View.
 * Exit returns to S-P4-07 via history so its URL-held list state survives
 * (AC-P4-07-14); a cold-opened link falls back to `exitNav`.
 */
export function ViewingBanner({ viewing }: { viewing: DashboardViewingVM }) {
  const navigate = useNavigate();
  const exit = () => {
    const cameFromApp = typeof window !== "undefined" && (window.history.state?.idx ?? 0) > 0;
    if (cameFromApp) navigate(-1);
    else navigate(href(viewing.exitNav));
  };
  const { member } = viewing;
  return (
    <div className="viewing-banner" role="region" aria-label={t("insights.viewing.title", { name: member.displayName })}>
      <ProfileAvatar />
      <span className="viewing-banner-copy">
        <span className="viewing-banner-title">{t("insights.viewing.title", { name: member.displayName })}</span>
        <span className="viewing-banner-sub">
          <span>{member.agentId}</span>
          <i aria-hidden />
          <span>{t(`insights.teamDrilldown.basis.${member.hierarchyBasis}`)}</span>
        </span>
      </span>
      <button type="button" className="viewing-exit" onClick={exit}>
        {t("insights.viewing.exit")}
      </button>
      <button type="button" className="viewing-close" aria-label={t("insights.viewing.exit")} onClick={exit}>
        <Icon token="close" size={24} tone="var(--color-text)" />
      </button>
    </div>
  );
}
