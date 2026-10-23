import { useEffect, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";
import { useThemeStore } from "@/store/theme";
import { useQuery } from "@tanstack/react-query";
import { getSettings } from "@/lib/api";
import type { BrandingSettings } from "@/lib/types";

// --- Logo ------------------------------------------------------------------
const defaultBranding: BrandingSettings = {
  name_bn: "সঞ্জীবন",
  name_en: "Shonjibon",
  show_bangla_name: true,
  logo_mark_url: "",
  logo_full_url: "",
  logo_dark_url: "",
  logo_height: 40,
  use_mark_only: false,
};

export function Logo({
  withWordmark = true,
  className,
  branding: brandingOverride,
}: {
  withWordmark?: boolean;
  className?: string;
  branding?: BrandingSettings;
}) {
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings, staleTime: 5 * 60 * 1000, retry: false });
  const branding = brandingOverride ?? { ...defaultBranding, ...settingsQ.data?.branding };
  const useFullLogo = Boolean(branding.logo_full_url && !branding.use_mark_only && !branding.logo_mark_url);
  const mark = branding.logo_mark_url || "/brand-mark.png";
  const darkMark = branding.logo_dark_url || mark;
  const height = Math.min(64, Math.max(28, branding.logo_height || 40));
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {useFullLogo
        ? <>
            <img src={branding.logo_full_url} alt="" aria-hidden="true" className="h-auto shrink-0 object-contain dark:hidden" style={{ height, maxWidth: height * 3.2 }} />
            <img src={branding.logo_dark_url || branding.logo_full_url} alt="" aria-hidden="true" className="hidden h-auto shrink-0 object-contain dark:block" style={{ height, maxWidth: height * 3.2 }} />
          </>
        : <span className="relative shrink-0" style={{ width: height, height }}>
            <img src={mark} alt="" aria-hidden="true" data-preserve-brightness="true" className="logo-mark-light h-full w-full object-contain" />
            <img src={darkMark} alt="" aria-hidden="true" data-preserve-brightness="true" className="logo-mark-dark absolute inset-0 hidden h-full w-full object-contain" />
          </span>}
      {withWordmark && (branding.show_bangla_name ? (
        <span className="flex min-w-0 flex-col leading-tight">
          <span className="font-bn text-[22px] font-bold text-ink" lang="bn">{branding.name_bn || defaultBranding.name_bn}</span>
          {!useFullLogo && <span className="hidden text-[11px] font-semibold tracking-wide text-ink-muted sm:block">{branding.name_en || defaultBranding.name_en}</span>}
        </span>
      ) : <span className="font-display text-xl font-semibold text-ink">{branding.name_en || defaultBranding.name_en}</span>)}
    </span>
  );
}

// --- Layout helpers ---------------------------------------------------

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("container-px", className)}>{children}</div>;
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl space-y-3", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-dark">{eyebrow}</p>}
      <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h2>
      {body && <p className="text-base leading-relaxed text-ink-muted">{body}</p>}
    </div>
  );
}

export function Section({
  className,
  children,
  id,
}: {
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-14 sm:py-20", className)}>
      <Container>{children}</Container>
    </section>
  );
}

// --- SEO -----------------------------------------------------------------

export function SEO({ title, description, image }: { title: string; description?: string; image?: string }) {
  const full = `${title} · সঞ্জীবন Shonjibon`;
  return (
    <Helmet>
      <title>{full}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={full} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
    </Helmet>
  );
}

// --- Lightbox --------------------------------------------------------------

export function Lightbox({
  images,
  index,
  onClose,
  onNavigate,
}: {
  images: { url: string; caption?: string }[];
  index: number | null;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (index === null) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, images.length, onClose, onNavigate]);

  if (index === null) return null;
  const current = images[index];

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-ink/90 p-4" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <CloseIcon />
      </button>
      <img
        src={current.url}
        alt={current.caption ?? ""}
        className="max-h-[75vh] max-w-full rounded-2xl object-contain"
        loading="lazy"
      />
      {current.caption && <p className="max-w-lg text-center text-sm text-white/90">{current.caption}</p>}
      <div className="flex gap-3">
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20" onClick={() => onNavigate((index - 1 + images.length) % images.length)}>
          ←
        </button>
        <button className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20" onClick={() => onNavigate((index + 1) % images.length)}>
          →
        </button>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

// --- Image with graceful fallback -----------------------------------------

export function Img({
  src,
  alt,
  className,
  width = 640,
  height = 480,
}: {
  src?: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const fallback = `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'><rect width='100%' height='100%' fill='#EAF4F4'/><text x='50%' y='52%' font-size='20' font-family='sans-serif' fill='#4F6F77' text-anchor='middle'>সঞ্জীবন</text></svg>`
  )}`;
  return (
    <img
      src={src || fallback}
      alt={alt}
      loading="lazy"
      width={width}
      height={height}
      className={className}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = fallback;
      }}
    />
  );
}

// --- Language toggle ---------------------------------------------------

export function LanguageToggle({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const isBn = i18n.resolvedLanguage === "bn";
  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isBn ? "en" : "bn")}
      className={cn(
        "flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-bg-soft",
        className
      )}
      aria-label="Toggle language"
    >
      <span className={isBn ? "text-teal-dark" : "text-ink-muted"}>বাং</span>
      <span className="text-ink-muted">/</span>
      <span className={!isBn ? "text-teal-dark" : "text-ink-muted"}>EN</span>
    </button>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const preference = useThemeStore((state) => state.preference);
  const cyclePreference = useThemeStore((state) => state.cyclePreference);
  const Icon = preference === "dark" ? MoonIcon : SunIcon;
  return (
    <button
      type="button"
      onClick={cyclePreference}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:bg-bg-soft",
        className,
      )}
      aria-label={t("theme.switch")}
      title={`${t("theme.switch")}: ${t(`theme.${preference}`)}`}
    >
      <Icon />
      <span className="sr-only sm:not-sr-only">{t(`theme.${preference}`)}</span>
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M20.5 15.2A8.5 8.5 0 0 1 8.8 3.5 8.5 8.5 0 1 0 20.5 15.2Z" />
    </svg>
  );
}
