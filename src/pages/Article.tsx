import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import { getArticleBySlug, listArticles } from "@/lib/api";
import { formatDate, readingTimeMinutes, t2 } from "@/lib/utils";
import { Section, SectionHeading, SEO, Img, Container } from "@/components/shared";

export default function Article() {
  const { slug = "" } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const articleQ = useQuery({ queryKey: ["article", slug], queryFn: () => getArticleBySlug(slug) });
  const relatedQ = useQuery({ queryKey: ["articles"], queryFn: () => listArticles() });

  const article = articleQ.data;
  const sanitizedBody = useMemo(() => (article ? DOMPurify.sanitize(t2(article, "body", lang)) : ""), [article, lang]);
  const related = (relatedQ.data ?? []).filter((a) => a.id !== article?.id).slice(0, 3);

  function share(platform: "facebook" | "whatsapp") {
    const url = window.location.href;
    const text = article ? t2(article, "title", lang) : "";
    const target =
      platform === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        : `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`;
    window.open(target, "_blank", "noopener,noreferrer");
  }

  if (articleQ.isLoading) {
    return <div className="container-px py-20 text-center text-ink-muted">{t("common.loading")}</div>;
  }

  if (!article) {
    return (
      <Section>
        <SectionHeading title={t("notFound.title")} body={t("notFound.body")} align="center" />
        <div className="mt-6 text-center">
          <Link to="/news" className="btn-primary">{t("actions.seeAll")}</Link>
        </div>
      </Section>
    );
  }

  return (
    <>
      <SEO title={t2(article, "title", lang)} description={t2(article, "excerpt", lang)} image={article.cover_image} />
      <Section>
        <Container className="max-w-2xl">
          <Img src={article.cover_image} alt={t2(article, "title", lang)} className="mb-6 aspect-video w-full rounded-2xl object-cover" width={800} height={450} />
          <p className="text-xs font-medium uppercase tracking-wide text-teal-dark">
            {formatDate(article.published_at, lang)} · {readingTimeMinutes(article.body_en, lang)}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{t2(article, "title", lang)}</h1>
          <p className="mt-2 text-sm text-ink-muted">
            {t("news.by")} {article.author}
          </p>
          <div
            className="prose prose-headings:font-display prose-headings:text-ink prose-p:text-ink-muted prose-p:leading-relaxed mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedBody }}
          />
          <div className="mt-8 flex gap-2 border-t border-border pt-6">
            <button onClick={() => share("facebook")} className="btn-secondary text-sm">
              Facebook
            </button>
            <button onClick={() => share("whatsapp")} className="btn-secondary text-sm">
              WhatsApp
            </button>
          </div>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="bg-bg-soft/60">
          <SectionHeading title={t("news.relatedArticles")} />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {related.map((a) => (
              <Link key={a.id} to={`/news/${a.slug}`} className="card group overflow-hidden">
                <Img src={a.cover_image} alt={t2(a, "title", lang)} className="h-36 w-full object-cover transition group-hover:scale-105" width={320} height={144} />
                <div className="space-y-1 p-4">
                  <p className="font-medium text-ink">{t2(a, "title", lang)}</p>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
