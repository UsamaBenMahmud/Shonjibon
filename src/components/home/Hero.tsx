import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, useReducedMotion } from "framer-motion";
import type { Product, Settings } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { Container } from "@/components/shared";

export function Hero({ settings, product }: { settings: Settings; product?: Product }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const reducedMotion = useReducedMotion();

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
      <Container className="relative grid items-center gap-8 py-14 sm:py-20 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
        <motion.div
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.6, ease: "easeOut" }}
          className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
        >
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
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link to="/products" className="btn-primary">
              {t("actions.shopNow")}
            </Link>
            <Link to="/about" className="btn-secondary">
              {t("actions.ourStory")}
            </Link>
          </div>
        </motion.div>
        <motion.div
          className="mx-auto w-full max-w-[25rem]"
          role="img"
          aria-label={lang === "bn" ? "সঞ্জীবন মাধ্যাকর্ষণ-চালিত পানি ফিল্টারের ত্রিমাত্রিক চিত্র" : "Three-dimensional illustration of the Shonjibon gravity-fed water filter"}
          initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={reducedMotion ? undefined : { opacity: 1, scale: 1, y: [0, -7, 0] }}
          transition={reducedMotion ? undefined : { opacity: { duration: 0.6 }, scale: { duration: 0.6 }, y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
        >
          <HeroFilterModel productName={product ? t2(product, "name", lang) : (lang === "bn" ? "সঞ্জীবন পানি ফিল্টার" : "Shonjibon Water Filter")} />
        </motion.div>
      </Container>
    </section>
  );
}

function HeroFilterModel({ productName }: { productName: string }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[24rem] [perspective:900px]">
      <div className="absolute inset-5 rounded-full bg-teal-light/15 blur-2xl" aria-hidden="true" />
      <svg viewBox="0 0 420 420" className="relative h-full w-full drop-shadow-[0_24px_28px_rgba(0,0,0,.24)]" aria-hidden="true">
        <defs>
          <linearGradient id="filterBody" x1="0" x2="1">
            <stop offset="0" stopColor="#d7f0f0" />
            <stop offset=".18" stopColor="#f4fbfb" />
            <stop offset=".72" stopColor="#b5dcdf" />
            <stop offset="1" stopColor="#75b9c0" />
          </linearGradient>
          <linearGradient id="filterLid" x1="0" x2="1">
            <stop offset="0" stopColor="#0b3d4a" />
            <stop offset=".55" stopColor="#147986" />
            <stop offset="1" stopColor="#0b3d4a" />
          </linearGradient>
          <linearGradient id="filterCartridge" x1="0" x2="1">
            <stop offset="0" stopColor="#f2795b" />
            <stop offset=".5" stopColor="#ffad8c" />
            <stop offset="1" stopColor="#d85b42" />
          </linearGradient>
        </defs>
        <ellipse cx="211" cy="374" rx="125" ry="22" fill="#062e38" opacity=".34" />
        <path d="M118 114c0-14 40-25 91-25s91 11 91 25v99c0 14-40 25-91 25s-91-11-91-25z" fill="url(#filterBody)" stroke="#d7f0f0" strokeWidth="3" />
        <ellipse cx="209" cy="114" rx="91" ry="25" fill="#f3fbfb" stroke="#fff" strokeWidth="4" />
        <path d="M118 213c0 14 40 25 91 25s91-11 91-25" fill="none" stroke="#7ab8be" strokeWidth="3" />
        <path d="M131 92c0-12 35-21 78-21s78 9 78 21v17c0 12-35 21-78 21s-78-9-78-21z" fill="url(#filterLid)" stroke="#bce9e9" strokeWidth="3" />
        <ellipse cx="209" cy="92" rx="78" ry="21" fill="#1a9aa8" stroke="#c7eeee" strokeWidth="3" />
        <path d="M146 240c0-10 28-18 63-18s63 8 63 18v48c0 10-28 18-63 18s-63-8-63-18z" fill="url(#filterCartridge)" stroke="#ffd0bd" strokeWidth="3" />
        <ellipse cx="209" cy="240" rx="63" ry="18" fill="#ffb394" stroke="#ffe0d3" strokeWidth="3" />
        <path d="M146 287c0 10 28 18 63 18s63-8 63-18" fill="none" stroke="#b94d39" strokeWidth="3" />
        <path d="M107 319c0-15 45-27 102-27s102 12 102 27v45c0 15-45 27-102 27s-102-12-102-27z" fill="url(#filterBody)" stroke="#ecffff" strokeWidth="3" />
        <ellipse cx="209" cy="319" rx="102" ry="27" fill="#eaf7f7" stroke="#fff" strokeWidth="4" />
        <path d="M107 363c0 15 45 27 102 27s102-12 102-27" fill="none" stroke="#75b9c0" strokeWidth="3" />
        <path d="M131 341c20 8 47 12 78 12s58-4 78-12" fill="none" stroke="#fff" strokeWidth="3" opacity=".7" />
        <path d="M311 329h30v17h-19v17h-11" fill="none" stroke="#0b3d4a" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M342 341v12" stroke="#f2795b" strokeWidth="8" strokeLinecap="round" />
        <path d="M344 367c0 7-5 12-11 12s-11-5-11-12c0-5 11-17 11-17s11 12 11 17Z" fill="#7be0e6" opacity=".9" />
        <circle cx="328" cy="141" r="13" fill="#fff" opacity=".72" />
        <circle cx="349" cy="112" r="7" fill="#fff" opacity=".52" />
      </svg>
      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-ocean-deep/70 px-4 py-2 text-center text-xs font-medium text-white shadow-lg backdrop-blur-sm">
        {productName}
      </span>
    </div>
  );
}
