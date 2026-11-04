import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Settings } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { Container } from "@/components/shared";

export function Hero({ settings }: { settings: Settings }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";

  return (
    <section
      className="border-b border-border/70 text-white"
      style={{ background: "linear-gradient(120deg, rgb(var(--ocean-deep)), rgb(var(--teal)))" }}
    >
      <Container className="py-14 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1
            lang={lang}
            className={`font-display text-[clamp(2rem,6vw,4rem)] font-semibold text-[#F4FAFA] [overflow-wrap:anywhere] ${lang === "bn" ? "leading-[1.5]" : "leading-[1.2]"}`}
          >
            {t2(settings, "motto", lang)}
          </h1>
          <p className="mt-4 text-xl font-medium leading-snug text-[#F4FAFA] sm:text-2xl">
            {t2(settings, "hero_title", lang)}
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg lg:mx-0">
            {t2(settings, "hero_subtitle", lang)}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/products" className="btn-primary">
              {t("actions.shopNow")}
            </Link>
            <Link to="/about" className="btn-secondary">
              {t("actions.ourStory")}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
