import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listArticles, listSimple } from "@/lib/api";
import type { ArticleCategory } from "@/lib/types";
import { formatDate, t2 } from "@/lib/utils";
import { Section, SectionHeading, SEO, Img } from "@/components/shared";
import { SkeletonCard, EmptyState } from "@/components/ui";
import { cn } from "@/utils/cn";

export default function News() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const [category, setCategory] = useState<string | null>(null);

  const categoriesQ = useQuery({ queryKey: ["article_categories"], queryFn: () => listSimple<ArticleCategory>("article_categories") });
  const articlesQ = useQuery({ queryKey: ["articles", category], queryFn: () => listArticles({ categorySlug: category ?? undefined }) });

  return (
    <>
      <SEO title={t("news.title")} description={t("news.subtitle")} />
      <Section>
        <SectionHeading title={t("news.title")} body={t("news.subtitle")} align="center" />

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setCategory(null)}
            className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition", !category ? "border-teal bg-teal/10 text-teal-dark" : "border-border text-ink-muted hover:bg-bg-soft")}
          >
            {t("news.allCategories")}
          </button>
          {(categoriesQ.data ?? []).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.slug)}
              className={cn("rounded-full border px-4 py-1.5 text-sm font-medium transition", category === cat.slug ? "border-teal bg-teal/10 text-teal-dark" : "border-border text-ink-muted hover:bg-bg-soft")}
            >
              {t2(cat, "name", lang)}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {articlesQ.isLoading
            ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
            : (articlesQ.data ?? []).map((a) => (
                <Link key={a.id} to={`/news/${a.slug}`} className="card group overflow-hidden">
                  <Img src={a.cover_image} alt={t2(a, "title", lang)} className="h-44 w-full object-cover transition group-hover:scale-105" width={360} height={176} />
                  <div className="space-y-2 p-4">
                    <p className="text-xs text-ink-muted">{formatDate(a.published_at, lang)}</p>
                    <p className="font-medium text-ink">{t2(a, "title", lang)}</p>
                    <p className="text-sm text-ink-muted line-clamp-2">{t2(a, "excerpt", lang)}</p>
                  </div>
                </Link>
              ))}
        </div>
        {!articlesQ.isLoading && (articlesQ.data ?? []).length === 0 && (
          <EmptyState title={t("common.empty")} />
        )}
      </Section>
    </>
  );
}
