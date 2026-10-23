import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Img, Section, SectionHeading, SEO } from "@/components/shared";
import { listSimple } from "@/lib/api";
import type { PageSection } from "@/lib/types";
import { t2 } from "@/lib/utils";

type ContextPageKey = "coastal" | "concerns" | "health";

export default function ContextPage({ page }: { page: ContextPageKey }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const sectionsQuery = useQuery({
    queryKey: ["page_sections", page],
    queryFn: () => listSimple<PageSection>("page_sections", { pageKey: page }),
  });
  const itemCount = page === "coastal" || page === "concerns" ? 6 : 5;
  const title = t(`pages.${page}.title`);
  const subtitle = t(`pages.${page}.subtitle`);

  return (
    <>
      <SEO title={title} description={subtitle} />
      <Section>
        <SectionHeading title={title} body={subtitle} align="center" />
        {sectionsQuery.isError && (
          <p role="alert" className="mt-8 rounded-xl border border-coral/40 bg-coral-soft p-4 text-sm text-ink">
            {t("common.loadError")}
          </p>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sectionsQuery.data?.length
            ? sectionsQuery.data.map((section) => (
              <article key={section.id} className="card p-6">
                {section.image && <Img src={section.image} alt={t2(section, "title", lang)} className="mb-4 aspect-video w-full rounded-xl object-cover" width={640} height={360} />}
                <h2 className="font-display text-lg font-semibold text-ink">{t2(section, "title", lang)}</h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t2(section, "body", lang)}</p>
                {section.type === "stats" && (
                  section.source_name && section.source_url
                    ? <a className="mt-3 inline-flex text-xs font-semibold text-teal-dark underline" href={section.source_url} target="_blank" rel="noreferrer">Source: {section.source_name}</a>
                    : <p className="mt-3 text-xs font-semibold text-coral-text">Source needs verification</p>
                )}
              </article>
            ))
            : !sectionsQuery.isError && Array.from({ length: itemCount }, (_, index) => (
              <article key={`${page}-${index}`} className="card p-6">
              <span aria-hidden="true" className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 font-semibold text-teal-dark">
                {index + 1}
              </span>
              <h2 className="font-display text-lg font-semibold text-ink">
                {t(`pages.${page}.items.${index}.title`)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {t(`pages.${page}.items.${index}.body`)}
              </p>
              </article>
            ))}
        </div>
        {page === "coastal" && (
          <div className="mt-10 rounded-2xl bg-ocean-deep p-7 text-center text-white sm:p-10">
            <h2 className="font-display text-2xl font-semibold">{t("pages.coastal.cta")}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
              {t("filterClaims.line1")} {t("filterClaims.line2")}
            </p>
            <Link to="/products/shonjibon-water-filter" className="btn-primary mt-6">
              {t("actions.viewDetails")}
            </Link>
          </div>
        )}
        {page === "health" && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-coral/40 bg-coral-soft p-6 text-ink">
            <h2 className="font-semibold">{t("pages.health.doctorTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed">{t("pages.health.doctorBody")}</p>
            <p className="mt-4 border-t border-ink/15 pt-4 text-sm font-medium">{t("pages.health.disclaimer")}</p>
            <Link to="/news" className="mt-4 inline-flex text-sm font-semibold text-teal-dark hover:underline">
              {t("news.title")} →
            </Link>
          </div>
        )}
      </Section>
    </>
  );
}
