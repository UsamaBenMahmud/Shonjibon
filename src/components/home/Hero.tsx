import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import type { Settings } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { Container } from "@/components/shared";

export function Hero({ settings }: { settings: Settings }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";

  return (
    <section
      className="relative overflow-hidden border-b border-border/70 text-white"
      style={{ background: "linear-gradient(120deg, rgb(var(--ocean-deep)), rgb(var(--teal)))" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgb(var(--teal-light)/.18),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgb(var(--coral)/.08),transparent_55%)]"
      />
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 left-0 w-full text-white/10"
        viewBox="0 0 1440 220"
        fill="currentColor"
      >
        <path d="M0 96C240 160 480 32 720 64C960 96 1200 192 1440 128V220H0V96Z" />
      </svg>
      <Container className="relative py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 text-sm font-medium text-teal-dark">
            {t2(settings, "motto", lang)}
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {t2(settings, "hero_title", lang)}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
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
        </motion.div>
      </Container>
    </section>
  );
}
