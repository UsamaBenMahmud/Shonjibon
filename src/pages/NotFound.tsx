import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section, SEO } from "@/components/shared";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <>
      <SEO title={t("notFound.title")} />
      <Section>
        <div className="mx-auto max-w-md text-center">
          <p className="font-display text-6xl font-semibold text-teal/40">404</p>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{t("notFound.title")}</h1>
          <p className="mt-2 text-ink-muted">{t("notFound.body")}</p>
          <Link to="/" className="btn-primary mt-6 inline-flex">
            {t("notFound.cta")}
          </Link>
        </div>
      </Section>
    </>
  );
}
