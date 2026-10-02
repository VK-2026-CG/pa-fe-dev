import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { formatDateAsOfNumeric } from "@/lib/format";
import { apiFetch } from "@/lib/apiClient";
import {
  BreakdownTable,
  ComparisonCard,
  DetailChartCard,
  GaugeComparisonCard,
  GaugeDonut,
  PendersCard,
  VariantValueCard,
  comparisonLabelKey,
} from "@/components/metrics";
import { ContextPill } from "@/components/chrome";
import { Icon } from "@/dls-stub";
import { NoticeBanner, StateEmpty, StateProcessing } from "@/components/ui";
import type { MetricDetailVM } from "@spec/performance-vm";

/** Metrics whose gauge + comparison render as the combined value-only card (AC-P4-02-21/23). */
const COMBINED_CARD_METRICS = new Set([
  "TPC",
  "PTPC",
  "FYP",
  "FYC",
  "AVERAGE_CASE_SIZE",
]);
/** Of those, the metrics with a repricing capability — the card is headed by the variant. */
const REPRICING_METRICS = new Set(["TPC", "PTPC"]);

export default function MetricDetailMY({
  query,
}: {
  query: Record<string, string | undefined>;
}) {
  const navigate = useNavigate();
  const [vm, setVm] = useState<MetricDetailVM | null>(null);
  const [error, setError] = useState<string | null>(null);
  const metricCode = query.metricCode ?? "TPC";

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    for (const k of [
      "period",
      "businessLine",
      "basis",
      "scope",
      "teamView",
    ] as const) {
      if (query[k]) params.set(k, query[k]!);
    }
    const res = await apiFetch(
      `/api/bff/v1/performance/metrics/${metricCode}?${params}`,
    );
    if (!res.ok) {
      setError(String(res.status));
      return;
    }
    setError(null);
    setVm(await res.json());
  }, [metricCode, query]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <div className="section card pad">Error {error}</div>;
  if (!vm) return <div className="section muted">Loading…</div>;
  const c = vm.context;
  // Ring drill-downs (persistency, activity ratio): the desktop frame (Figma 22:18658) carries only the
  // Product chip and no "As of" date, so `.dd-page-ring` hides those two at breakpoint.desktop.
  const ringPage = (vm.sections ?? []).some((sec) => sec.type === "THRESHOLD_GAUGE");

  return (
    <div className={`dd-page${ringPage ? " dd-page-ring" : ""}`}>
      {/* AC-P4-02-22: back row carries the as-of date; the metric title moved
          out of the bar into the page body below it. Figma 1:16115: a plain
          24px row on the page background — Material arrow_back, "Back" 14/20
          Medium, "As of dd/MM/yyyy" 11/16 on the right. */}
      <div className="appbar detail-appbar">
        <button className="back" aria-label={t("insights.common.back")} onClick={() => navigate(-1)}>
          <Icon token="arrow-back" size={24} className="back-icon-mobile" />
          <Icon token="back" size={24} className="back-icon-desktop" />
          <span className="back-label">{t("insights.common.back")}</span>
        </button>
        {/* Desktop (Figma 22:15209): back icon, a 1px divider, then "Performance > TPC"; the
            labelled Back above is the mobile face. */}
        <nav className="detail-breadcrumb" aria-label={t("insights.teamDrilldown.breadcrumb")}>
          <Link to="/insights/performance">{t("insights.dashboard.title")}</Link>
          <span className="detail-crumb-sep" aria-hidden="true">&gt;</span>
          <span aria-current="page">{t(`insights.metric.${metricCode}.title`)}</span>
        </nav>
        <span className="detail-asof muted">{formatDateAsOfNumeric(c.asOfDate)}</span>
      </div>
      <div className="section dd-title-section">
        <h1 className="page-title">{t(`insights.metric.${metricCode}.title`)}</h1>
      </div>
      {/* Context strip — the labelled Business/Period pills (AC-P4-02-22). No
          teamView chip at any scope (AC-P4-02-60); ALL reads "Both"
          (AC-P4-02-61). Labels match the dashboard's "Business"/"Period". */}
      <div className="section">
        <div className="filter-row dd-chips">
          <ContextPill
            labelKey="insights.dashboard.filter.product"
            value={t(`insights.detail.businessLine.${c.businessLine}`)}
          />
          <ContextPill
            labelKey="insights.dashboard.filter.time"
            value={t(`insights.period.${c.period}`)}
          />
        </div>
      </div>

      {vm.dataState === "PROCESSING" && (
        <div className="section">
          <StateProcessing
            onRefresh={() => {
              setVm(null);
              void load();
            }}
          />
        </div>
      )}
      {vm.dataState === "EMPTY" && (
        <div className="section">
          <StateEmpty metricCode={metricCode} />
        </div>
      )}

      {vm.dataState === "OK" && (
        <>
          {vm.notices?.map((n) => (
            <div className="section" key={n.code}>
              <NoticeBanner notice={n} />
            </div>
          ))}
          {(() => {
            const nodes: React.ReactNode[] = [];
            const secs = vm.sections;
            // AC-P4-02-21 (MetricDetail_S-P4-02 v1.3.0): a gauge.primary
            // immediately followed by comparison.primary renders as one
            // combined value-only card instead of two. Originally TPC/PTPC;
            // extended to FYP/FYC/AVERAGE_CASE_SIZE (requester direction,
            // 2026-09-24). A gauge with no comparison keeps the same
            // value-only card, never the standalone donut. sections[] order
            // and every other pairing/section are unchanged.
            const pairsGaugeComparison = COMBINED_CARD_METRICS.has(metricCode);
            for (let i = 0; i < secs.length; i++) {
              const s = secs[i];
              if (!s) continue;
              const next = secs[i + 1];
              if (pairsGaugeComparison && s.type === "GAUGE") {
                const comparison = next?.type === "COMPARISON" ? next : undefined;
                nodes.push(
                  <div className="section" key={s.id}>
                    <GaugeComparisonCard
                      gauge={s}
                      comparison={comparison}
                      metricCode={metricCode}
                      labelKey={
                        comparison
                          ? comparisonLabelKey(metricCode, comparison.change.display)
                          : ""
                      }
                      period={c.period}
                      repricing={REPRICING_METRICS.has(metricCode)}
                    />
                  </div>,
                );
                if (comparison) i += 1; // consumed the paired comparison section too
                continue;
              }
              // AC-P4-02-27 (v1.5.0): variant.with-repricing + penders.primary
              // share a two-column row at breakpoint.desktop. Only paired when
              // both are present — a lone section stays full-width.
              if (s.type === "VARIANT_VALUE" && next?.type === "PENDERS") {
                nodes.push(
                  <div className="section section-pair" key={s.id}>
                    <VariantValueCard s={s} metricCode={metricCode} />
                    <PendersCard s={next} linkFace={REPRICING_METRICS.has(metricCode)} />
                  </div>,
                );
                i += 1; // consumed the paired penders section too
                continue;
              }
              // AC-P4-02-29/-30 (v1.6.0): two adjacent BREAKDOWN sections
              // share one "Breakdown by Product" heading and a two-column row
              // at breakpoint.desktop. Only paired when both are present — a
              // lone breakdown table stays full-width. TPC/PTPC emit both
              // variants (OQ-38 closed in v1.8.0); FYP emits only one.
              if (s.type === "BREAKDOWN" && next?.type === "BREAKDOWN") {
                nodes.push(
                  <div className="section dd-breakdown-section" key={s.id}>
                    <div className="dd-section-title">
                      {t("insights.detail.breakdownByProduct")}
                    </div>
                    <div className="section-pair">
                      <BreakdownTable s={s} metricCode={metricCode} />
                      <BreakdownTable s={next} metricCode={metricCode} />
                    </div>
                  </div>,
                );
                i += 1; // consumed the paired breakdown section too
                continue;
              }
              // Figma Metric Drill downs: ring/bar chart + its YTD rows share one card.
              if (s.type === "THRESHOLD_GAUGE" || s.type === "BAR_COMPARISON") {
                const comparison = next?.type === "COMPARISON" ? next : undefined;
                nodes.push(
                  <div className="section" key={s.id}>
                    <DetailChartCard chart={s} comparison={comparison} metricCode={metricCode} period={c.period} />
                  </div>,
                );
                if (comparison) i += 1; // consumed the paired comparison section too
                continue;
              }
              switch (s.type) {
                case "GAUGE":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <GaugeDonut s={s} metricCode={metricCode} />
                    </div>,
                  );
                  break;
                case "COMPARISON":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <ComparisonCard
                        s={s}
                        metricCode={metricCode}
                        labelKey={comparisonLabelKey(
                          metricCode,
                          s.change.display,
                        )}
                      />
                    </div>,
                  );
                  break;
                case "VARIANT_VALUE":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <VariantValueCard s={s} metricCode={metricCode} />
                    </div>,
                  );
                  break;
                case "PENDERS":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <PendersCard s={s} linkFace={REPRICING_METRICS.has(metricCode)} />
                    </div>,
                  );
                  break;
                case "BREAKDOWN":
                  // A metric with no repricing variants (FYP) has no "Without
                  // repricing" table to name; its one card is headed
                  // "Product wise {metric} distribution" (Figma 1:16325).
                  nodes.push(
                    <div className="section dd-breakdown-section" key={s.id}>
                      <div className="dd-section-title">
                        {t("insights.detail.breakdownByProduct")}
                      </div>
                      <BreakdownTable
                        s={s}
                        metricCode={metricCode}
                        heading={
                          REPRICING_METRICS.has(metricCode)
                            ? undefined
                            : t("insights.detail.productDistribution", {
                                metric: t(`insights.metric.${metricCode}.title`),
                              })
                        }
                      />
                    </div>,
                  );
                  break;
                default:
                  break; // unknown section type — skip (AC-P4-02-07)
              }
            }
            return nodes;
          })()}
        </>
      )}
    </div>
  );
}
