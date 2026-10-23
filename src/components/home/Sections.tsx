import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  Article,
  CommunityVisit,
  ImpactStat,
  JourneyMilestone,
  Product,
  TestResult,
  TeamMember,
  Testimonial,
} from "@/lib/types";
import { formatDate, formatNumber, t2 } from "@/lib/utils";
import { Section, SectionHeading, Img } from "@/components/shared";
import { Badge, Button, Input, SampleBadge } from "@/components/ui";
import { ProductCard } from "@/components/product";
import { subscribeNewsletter } from "@/lib/api";
import { useUIStore } from "@/store/ui";
import { newsletterSchema } from "@/lib/schemas";
import { ShellStory } from "@/components/shell/Story";

// --- Impact counters --------------------------------------------------

function useCountUp(target: number, active: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active]);
  return value;
}

function StatCounter({ stat }: { stat: ImpactStat }) {
  const { i18n, t } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setActive(true);
    }, { threshold: 0.4 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const value = useCountUp(stat.value, active);

  const status = stat.is_sample ? "sample" : stat.status ?? (stat.source_name && stat.source_url ? "verified" : "target");
  const statusLabel = status === "sample" ? "Sample" : status === "target" ? "Target" : "Verified";
  const content = (
    <div ref={ref} className="card relative flex h-full min-h-40 flex-col gap-3 overflow-hidden p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal/10 text-xl text-teal-dark" aria-hidden="true">{stat.icon || "✳"}</span>
        {status === "sample" ? <SampleBadge label={statusLabel} /> : <Badge tone={status === "target" ? "sand" : "teal"}>{statusLabel}</Badge>}
      </div>
      <div>
        <p className="font-display text-3xl font-semibold tabular-nums text-teal-dark">
          {stat.prefix}{formatNumber(value, lang)}{stat.suffix}
        </p>
        <p className="mt-1 font-semibold text-ink">{t2(stat, "label", lang)}</p>
        {(stat.description_en || stat.description_bn) && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t2(stat, "description", lang)}</p>}
      </div>
      {stat.link && <span className="mt-auto text-xs font-semibold text-teal-dark">{t("actions.learnMore")} →</span>}
    </div>
  );
  return stat.link ? <Link to={stat.link} className="block h-full rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal">{content}</Link> : content;
}

export function ImpactSection({ stats, testResults = [] }: { stats: ImpactStat[]; testResults?: TestResult[] }) {
  const { t } = useTranslation();
  if (!stats.length) return null;
  const verifiedTests = testResults.filter((result) => result.status === "verified" && !result.is_sample).length;
  const ordered = stats.map((stat) => stat.label_en === "Lab tests completed"
    ? { ...stat, value: verifiedTests, status: "target" as const, is_sample: false }
    : stat).sort((a, b) => a.sort_order - b.sort_order);
  const featured = ordered.find((stat) => stat.is_featured) ?? ordered[0];
  const rest = ordered.filter((stat) => stat.id !== featured.id);
  return (
    <Section className="bg-ocean-deep">
      <SectionHeading title={<span className="text-white">{t("home.impactTitle")}</span>} align="center" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-6 text-white sm:row-span-2 lg:col-span-2">
          {featured && <StatCounter stat={featured} />}
          <div className="pointer-events-none absolute bottom-6 right-6 opacity-80" aria-hidden="true">
            <svg viewBox="0 0 120 120" className="h-28 w-28" fill="none">
              <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="9" opacity=".2" />
              <circle cx="60" cy="60" r="44" stroke="currentColor" strokeWidth="9" strokeDasharray="205 276" strokeLinecap="round" transform="rotate(-90 60 60)" />
              <path d="M42 37c19-12 42-3 45 12m0 0-9-6m9 6 1-11M77 83c-19 12-42 3-45-12m0 0 9 6m-9-6-1 11" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        {rest.map((stat) => (
          <div key={stat.id} className={stat.size === "L" ? "sm:col-span-2" : ""}>
            <StatCounter stat={stat} />
          </div>
        ))}
      </div>
    </Section>
  );
}

// --- Shell diagram -----------------------------------------------------

export function ShellDiagramSection({ products }: { products: Product[] }) {
  return <ShellStory products={products} />;
}

// --- Products section --------------------------------------------------

export function ProductsSection({ products }: { products: Product[] }) {
  const { t } = useTranslation();
  const flagship = products.find((p) => p.is_flagship);
  const others = products.filter((p) => !p.is_flagship);
  return (
    <Section>
      <SectionHeading title={t("home.productsTitle")} body={t("home.productsSubtitle")} />
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {flagship && <ProductCard product={flagship} large />}
        {others.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link to="/products" className="btn-secondary">
          {t("actions.seeAll")}
        </Link>
      </div>
    </Section>
  );
}

// --- Circular economy loop ----------------------------------------------

export function CircularEconomySection() {
  const { t } = useTranslation();
  const steps = [
    { label: "Collect", bn: "সংগ্রহ" },
    { label: "Clean", bn: "পরিষ্কার" },
    { label: "Extract", bn: "নিষ্কাশন" },
    { label: "Build", bn: "তৈরি" },
    { label: "Reuse", bn: "পুনর্ব্যবহার" },
  ];
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  return (
    <Section className="bg-bg-soft/60">
      <SectionHeading title={t("home.loopTitle")} body={t("home.loopBody")} align="center" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {steps.map((step, idx) => (
          <div key={step.label} className="relative flex flex-col items-center gap-2 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-teal bg-surface font-display text-lg font-semibold text-teal-dark">
              {idx + 1}
            </div>
            <p className="text-sm font-medium text-ink">{lang === "bn" ? step.bn : step.label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// --- Waste reduction ring -----------------------------------------------

export function WasteRingSection({ percent }: { percent: number }) {
  const { t } = useTranslation();
  const r = 64;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - percent / 100);
  return (
    <Section>
      <div className="grid items-center gap-10 sm:grid-cols-2">
        <svg viewBox="0 0 160 160" className="mx-auto w-48">
          <circle cx="80" cy="80" r={r} fill="none" stroke="#EAF4F4" strokeWidth={14} />
          <circle
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke="#1A9AA8"
            strokeWidth={14}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform="rotate(-90 80 80)"
          />
          <text x="80" y="86" textAnchor="middle" fontSize="28" fontWeight={700} fill="#0B3F4F">
            {percent}%
          </text>
        </svg>
        <SectionHeading title={t("home.wasteTitle")} body={t("home.wasteBody")} />
      </div>
    </Section>
  );
}

// --- Journey timeline ---------------------------------------------------

export function JourneyTimelineSection({ milestones }: { milestones: JourneyMilestone[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  if (!milestones.length) return null;
  return (
    <Section className="bg-bg-soft/60">
      <SectionHeading title={t("home.journeyTitle")} />
      <div className="snap-row mt-8 flex gap-4 overflow-x-auto pb-4">
        {milestones.map((m) => (
          <div key={m.id} className="snap-item card w-64 shrink-0 space-y-3 p-4">
            <Img src={m.image} alt={t2(m, "title", lang)} className="h-32 w-full rounded-xl object-cover" width={256} height={128} />
            <Badge tone="teal">{t2(m, "date_label", lang)}</Badge>
            <p className="font-medium text-ink">{t2(m, "title", lang)}</p>
            <p className="text-sm leading-relaxed text-ink-muted">{t2(m, "body", lang)}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// --- Community preview ---------------------------------------------------

export function CommunityPreviewSection({ visits }: { visits: CommunityVisit[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  if (!visits.length) return null;
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title={t("home.communityTitle")} />
        <Link to="/community" className="text-sm font-medium text-teal-dark hover:underline">
          {t("actions.seeAll")}
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {visits.map((visit) => (
          <Link key={visit.id} to="/community" className="card group overflow-hidden">
            <Img src={visit.cover_image} alt={t2(visit, "title", lang)} className="h-40 w-full object-cover transition group-hover:scale-105" width={320} height={160} />
            <div className="p-4">
              <p className="font-medium text-ink">{t2(visit, "title", lang)}</p>
              <p className="mt-1 text-sm text-ink-muted">{t2(visit, "description", lang)}</p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// --- Articles preview ---------------------------------------------------

export function ArticlesPreviewSection({ articles }: { articles: Article[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  if (!articles.length) return null;
  return (
    <Section className="bg-bg-soft/60">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title={t("home.newsTitle")} />
        <Link to="/news" className="text-sm font-medium text-teal-dark hover:underline">
          {t("actions.seeAll")}
        </Link>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {articles.slice(0, 3).map((a) => (
          <Link key={a.id} to={`/news/${a.slug}`} className="card group overflow-hidden">
            <Img src={a.cover_image} alt={t2(a, "title", lang)} className="h-40 w-full object-cover transition group-hover:scale-105" width={320} height={160} />
            <div className="space-y-2 p-4">
              <p className="text-xs text-ink-muted">{formatDate(a.published_at, lang)}</p>
              <p className="font-medium text-ink">{t2(a, "title", lang)}</p>
              <p className="text-sm text-ink-muted line-clamp-2">{t2(a, "excerpt", lang)}</p>
            </div>
          </Link>
        ))}
      </div>
    </Section>
  );
}

// --- Team preview ---------------------------------------------------------

function Avatar({ name, photo }: { name: string; photo?: string }) {
  if (photo) return <img src={photo} alt={name} className="h-16 w-16 rounded-full object-cover" width={64} height={64} />;
  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 font-display text-lg font-semibold text-teal-dark">
      {initials}
    </div>
  );
}

export function TeamPreviewSection({ members }: { members: TeamMember[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const core = members.filter((m) => m.group_type === "team").slice(0, 6);
  if (!core.length) return null;
  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title={t("home.teamTitle")} />
        <Link to="/team" className="text-sm font-medium text-teal-dark hover:underline">
          {t("actions.seeAll")}
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {core.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-2 text-center">
            <Avatar name={m.name} photo={m.photo_url} />
            <p className="text-sm font-medium text-ink">{m.name}</p>
            <p className="text-xs text-ink-muted">{t2(m, "title", lang)}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

// --- Testimonials -----------------------------------------------------

export function TestimonialsSection({ items }: { items: Testimonial[] }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  if (!items.length) return null;
  return (
    <Section className="bg-bg-soft/60">
      <SectionHeading title={t("home.testimonialsTitle")} align="center" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="card space-y-3 p-5">
            {item.is_sample && <SampleBadge label={t("common.sample")} />}
            <p className="text-sm italic leading-relaxed text-ink">“{t2(item, "quote", lang)}”</p>
            <div className="flex items-center gap-2 pt-2">
              <Avatar name={item.name} photo={item.avatar_url} />
              <div>
                <p className="text-sm font-medium text-ink">{item.name}</p>
                <p className="text-xs text-ink-muted">{t2(item, "role", lang)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

// --- Newsletter CTA -----------------------------------------------------

export function NewsletterSection() {
  const { t } = useTranslation();
  const pushToast = useUIStore((s) => s.pushToast);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = newsletterSchema.safeParse({ email, company });
    if (!validation.success) {
      pushToast(validation.error.issues[0]?.message ?? "সঠিক ইমেইল দিন / Enter a valid email", "error");
      return;
    }
    setLoading(true);
    try {
      await subscribeNewsletter(email, company);
      pushToast(t("contact.success"), "success");
      setEmail("");
      setCompany("");
    } catch (error) {
      pushToast(error instanceof Error
        ? `সাবস্ক্রাইব করা যায়নি / Could not subscribe: ${error.message}`
        : "সাবস্ক্রাইব করা যায়নি / Could not subscribe", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Section>
      <div className="card flex flex-col items-center gap-5 bg-gradient-to-br from-teal to-teal-dark p-10 text-center text-white sm:p-14">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("home.ctaTitle")}</h2>
        <p className="max-w-md text-white/90">{t("home.ctaBody")}</p>
        <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
          />
          <Input
            type="email"
            required
            placeholder={t("home.newsletterPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white/95"
          />
          <Button type="submit" variant="secondary" disabled={loading} className="shrink-0">
            {t("actions.subscribe")}
          </Button>
        </form>
      </div>
    </Section>
  );
}
