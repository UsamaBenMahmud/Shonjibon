import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { listSimple } from "@/lib/api";
import type { TestResult } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { Section, SectionHeading, SEO } from "@/components/shared";
import { Badge } from "@/components/ui";

export default function Testing() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const resultsQ = useQuery({ queryKey: ["test_results"], queryFn: () => listSimple<TestResult>("test_results") });
  const results = resultsQ.data ?? [];

  const chartData = results
    .filter((r) => r.status !== "pending")
    .map((r) => ({
      name: t2(r, "parameter", lang),
      [t("testing.before")]: r.raw_value ?? 0,
      [t("testing.after")]: r.filtered_value ?? 0,
      [t("testing.standard")]: r.standard_value ?? 0,
    }));

  return (
    <>
      <SEO title={t("testing.title")} description={t("testing.subtitle")} />
      <Section>
        <SectionHeading title={t("testing.title")} body={t("testing.subtitle")} align="center" />
      </Section>

      <Section className="bg-bg-soft/60">
        <div className="grid gap-4 sm:grid-cols-3">
          {["before", "after", "control"].map((key) => (
            <div key={key} className="card p-5 text-center">
              <p className="text-sm font-medium uppercase tracking-wide text-ink-muted">{t(`testing.${key}`)}</p>
              <p className="mt-2 font-display text-2xl font-semibold text-teal-dark">
                {key === "before" ? "~38 NTU" : key === "after" ? "~4 NTU" : "~36 NTU"}
              </p>
              <Badge tone="coral" className="mt-2">{t("common.sample")}</Badge>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h3 className="mb-4 font-display text-xl font-semibold text-ink">{t("testing.chart")}</h3>
        <div className="h-80 w-full rounded-2xl border border-border bg-surface p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#D6E6E6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey={t("testing.before")} fill="#F2795B" radius={[6, 6, 0, 0]} />
              <Bar dataKey={t("testing.after")} fill="#1A9AA8" radius={[6, 6, 0, 0]} />
              <Bar dataKey={t("testing.standard")} fill="#0B3F4F" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section className="bg-bg-soft/60">
        <h3 className="mb-4 font-display text-xl font-semibold text-ink">{t("testing.tableTitle")}</h3>
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-soft text-left text-ink-muted">
                <th className="px-4 py-3">{t("testing.parameter")}</th>
                <th className="px-4 py-3">{t("testing.before")}</th>
                <th className="px-4 py-3">{t("testing.after")}</th>
                <th className="px-4 py-3">{t("testing.control")}</th>
                <th className="px-4 py-3">{t("testing.standard")}</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium text-ink">
                    {t2(r, "parameter", lang)} <span className="text-xs text-ink-muted">({r.unit})</span>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{r.raw_value ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.filtered_value ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">{r.control_value ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {r.standard_value ?? "—"} <span className="text-xs">({r.standard_source})</span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "pending" ? (
                      <Badge tone="sand">{t("common.testingInProgress")}</Badge>
                    ) : r.status === "verified" ? (
                      <Badge tone="teal">{lang === "bn" ? "যাচাইকৃত" : "Verified"}</Badge>
                    ) : (
                      <Badge tone="coral">{t("common.sample")}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  );
}
