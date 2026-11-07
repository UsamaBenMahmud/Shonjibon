import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Settings } from "@/lib/types";
import { isBrandLogoImage, t2 } from "@/lib/utils";
import { Container, Img } from "@/components/shared";

export function Hero({ settings, productImage }: { settings: Settings; productImage?: string }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const image = productImage && !isBrandLogoImage(productImage)
    ? productImage
    : "/demo-images/hero-water-filter.svg";

  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-surface">
      <div className="pointer-events-none absolute -right-36 -top-40 h-[28rem] w-[28rem] rounded-full bg-teal/10 blur-3xl" aria-hidden="true" />
      <Container className="relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
        <div className="max-w-2xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/10 px-4 py-2 text-sm font-semibold text-teal-dark">
            <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
            {t2(settings, "motto", lang)}
          </p>
          <h1
            lang={lang}
            className={`max-w-[15ch] font-display text-[clamp(2.4rem,5vw,4.5rem)] font-semibold tracking-tight text-ink [overflow-wrap:anywhere] ${lang === "bn" ? "leading-[1.4]" : "leading-[1.08]"}`}
          >
            {t2(settings, "hero_title", lang)}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
            {t2(settings, "hero_subtitle", lang)}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/products" className="btn-primary">
              {t("actions.shopNow")}
            </Link>
            <Link to="/about" className="btn-secondary">
              {t("actions.ourStory")}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-5 rounded-[2rem] bg-gradient-to-br from-teal/20 via-bg-soft to-coral/15 sm:inset-8" aria-hidden="true" />
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-border/80 bg-bg-soft p-5 shadow-[0_24px_70px_rgb(var(--shadow-card)/0.12)] sm:p-8">
            <Img
              src={image}
              alt={lang === "en" ? "Shonjibon flagship water filter" : "সঞ্জীবনের প্রধান পানি ফিল্টার"}
              className="h-full w-full object-contain"
              width={720}
              height={540}
            />
          </div>
          <div className="absolute -bottom-4 left-4 rounded-2xl border border-border bg-surface px-4 py-3 shadow-lg sm:bottom-5 sm:left-0 sm:px-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-dark">
              {lang === "en" ? "Circular innovation" : "চক্রাকার উদ্ভাবন"}
            </p>
            <p className="mt-1 text-sm font-medium text-ink">
              {lang === "en" ? "Shells, science & community" : "খোলস, বিজ্ঞান ও কমিউনিটি"}
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
