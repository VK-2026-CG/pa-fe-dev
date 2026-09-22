import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { t } from "@/lib/i18n";
import { href } from "@/lib/nav";
import { formatDateAsOf } from "@/lib/format";
import { apiFetch } from "@/lib/apiClient";
import {
  BarComparison,
  BreakdownTable,
  ComparisonCard,
  GaugeComparisonCard,
  GaugeDonut,
  PendersCard,
  ThresholdArc,
  VariantValueCard,
  comparisonLabelKey,
} from "@/components/metrics";
import { ContextPill } from "@/components/chrome";
import { NoticeBanner, StateEmpty, StateProcessing } from "@/components/ui";
import { Icon, Tag } from "@/dls-stub";
import type { MetricDetailVM } from "@spec/performance-vm";

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

  return (
    <>
      {/* AC-P4-02-22: back row carries the as-of date; the metric title moved
          out of the bar into the page body below it. */}
      <div className="appbar detail-appbar">
        <button className="back" aria-label={t("insights.common.back")} onClick={() => navigate(-1)}>
          ←<span className="back-label">{t("insights.common.back")}</span>
        </button>
        <span className="detail-asof muted">{formatDateAsOf(c.asOfDate)}</span>
      </div>
      <div className="section">
        <h1 className="page-title">{t(`insights.metric.${metricCode}.title`)}</h1>
      </div>
      {/* Context strip — teamView chip first (AC-P4-02-10), then the labelled
          Product/Time pills shared with S-P4-01 (AC-P4-02-22). */}
      <div className="section">
        <div className="filter-row">
          {c.teamView && <Tag>{t(`insights.teamView.${c.teamView}`)}</Tag>}
          <ContextPill
            labelKey="insights.dashboard.filter.product"
            value={
              c.businessLine === "ALL"
                ? t("insights.businessLine.ALL.chip")
                : t(`insights.businessLine.${c.businessLine}`)
            }
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
            // AC-P4-02-21 (MetricDetail_S-P4-02 v1.3.0): for TPC/PTPC, a
            // gauge.primary immediately followed by comparison.primary
            // renders as one combined card instead of two. sections[]
            // order and every other pairing/section are unchanged.
            const pairsGaugeComparison =
              metricCode === "TPC" || metricCode === "PTPC";
            for (let i = 0; i < secs.length; i++) {
              const s = secs[i];
              if (!s) continue;
              const next = secs[i + 1];
              if (
                pairsGaugeComparison &&
                s.type === "GAUGE" &&
                next?.type === "COMPARISON"
              ) {
                nodes.push(
                  <div className="section" key={s.id}>
                    <GaugeComparisonCard
                      gauge={s}
                      comparison={next}
                      metricCode={metricCode}
                      labelKey={comparisonLabelKey(
                        metricCode,
                        next.change.display,
                      )}
                      period={c.period}
                    />
                  </div>,
                );
                i += 1; // consumed the paired comparison section too
                continue;
              }
              // AC-P4-02-27 (v1.5.0): variant.with-repricing + penders.primary
              // share a two-column row at breakpoint.desktop. Only paired when
              // both are present — a lone section stays full-width.
              if (s.type === "VARIANT_VALUE" && next?.type === "PENDERS") {
                nodes.push(
                  <div className="section section-pair" key={s.id}>
                    <VariantValueCard s={s} />
                    <PendersCard s={next} />
                  </div>,
                );
                i += 1; // consumed the paired penders section too
                continue;
              }
              // AC-P4-02-29/-30 (v1.6.0): two adjacent BREAKDOWN sections
              // share one "Breakdown by Product" heading and a two-column row
              // at breakpoint.desktop. Only paired when both are present — a
              // lone breakdown table stays full-width. No fixture emits two
              // BREAKDOWN sections today (OQ-38), so this path is unrendered
              // until breakdown.with-repricing exists.
              if (s.type === "BREAKDOWN" && next?.type === "BREAKDOWN") {
                nodes.push(
                  <div className="section" key={s.id}>
                    <div className="title14" style={{ marginBottom: 8 }}>
                      {t("insights.detail.breakdownByProduct")}
                    </div>
                    <div className="section-pair">
                      <BreakdownTable s={s} />
                      <BreakdownTable s={next} />
                    </div>
                  </div>,
                );
                i += 1; // consumed the paired breakdown section too
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
                case "THRESHOLD_GAUGE":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <ThresholdArc s={s} metricCode={metricCode} />
                    </div>,
                  );
                  break;
                case "BAR_COMPARISON":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <BarComparison s={s} metricCode={metricCode} />
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
                      <VariantValueCard s={s} />
                    </div>,
                  );
                  break;
                case "PENDERS":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <PendersCard s={s} />
                    </div>,
                  );
                  break;
                case "BREAKDOWN":
                  nodes.push(
                    <div className="section" key={s.id}>
                      <div className="title14" style={{ marginBottom: 8 }}>
                        {t("insights.detail.breakdownByProduct")}
                      </div>
                      <BreakdownTable s={s} />
                    </div>,
                  );
                  break;
                default:
                  break; // unknown section type — skip (AC-P4-02-07)
              }
            }
            return nodes;
          })()}
          {vm.historyNav && (
            <div className="section">
              <Link className="footer-link" to={href(vm.historyNav)}>
                <Icon
                  token="sheet.HISTORICAL_DATA"
                  size={20}
                  tone="var(--color-brand)"
                />
                <span style={{ flex: 1 }}>{t("insights.history.title")}</span>
                <Icon
                  token="arrow-right-s"
                  size={20}
                  tone="var(--color-text-muted)"
                />
              </Link>
            </div>
          )}
        </>
      )}
    </>
  );
}
