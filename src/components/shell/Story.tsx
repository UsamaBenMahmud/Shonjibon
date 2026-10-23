import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { Product, ShellPart } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { Section, SectionHeading } from "@/components/shared";
import { getSettings, listSimple } from "@/lib/api";

type StoryPart = Pick<ShellPart, "key" | "name_en" | "name_bn" | "description_en" | "description_bn" | "hotspot_x" | "hotspot_y">;

const defaultParts: StoryPart[] = [
  {
    key: "carapace",
    hotspot_x: 29,
    hotspot_y: 39,
    name_en: "Carapace",
    name_bn: "মাথার খোলস",
    description_en: "The hard head shell contains chitin, minerals, and proteins.",
    description_bn: "শক্ত মাথার খোলসে কাইটিন, খনিজ ও প্রোটিন থাকে।",
  },
  {
    key: "abdomen",
    hotspot_x: 60,
    hotspot_y: 50,
    name_en: "Abdomen plates",
    name_bn: "পেটের খোলস",
    description_en: "The overlapping body plates are cleaned and prepared for processing.",
    description_bn: "একটির ওপর আরেকটি থাকা দেহের খোলস পরিষ্কার করে প্রক্রিয়ার জন্য প্রস্তুত করা হয়।",
  },
  {
    key: "tail",
    hotspot_x: 83,
    hotspot_y: 59,
    name_en: "Tail fan",
    name_bn: "লেজের পাখা",
    description_en: "The tail fan is another part of the shell material that can be reused.",
    description_bn: "লেজের পাখাও পুনর্ব্যবহারযোগ্য খোলসের অংশ।",
  },
  {
    key: "layers",
    hotspot_x: 44,
    hotspot_y: 75,
    name_en: "Shell layers",
    name_bn: "খোলসের স্তর",
    description_en: "Shells contain a protein surface, chitin-protein fibers, and mineral material. Exact composition varies.",
    description_bn: "খোলসে প্রোটিনের উপরিভাগ, কাইটিন-প্রোটিন তন্তু ও খনিজ থাকে। সঠিক অনুপাত ভিন্ন হতে পারে।",
  },
];

export function ShrimpShellIllustration({ parts = defaultParts, photoUrl = "" }: { parts?: StoryPart[]; photoUrl?: string }) {
  const { i18n } = useTranslation();
  const [selectedKey, setSelectedKey] = useState(parts[0]?.key ?? "carapace");
  useEffect(() => {
    if (!parts.some((part) => part.key === selectedKey) && parts[0]) setSelectedKey(parts[0].key);
  }, [parts, selectedKey]);
  const selected = parts.find((part) => part.key === selectedKey) ?? defaultParts[0];
  const lang = i18n.resolvedLanguage === "bn" ? 1 : 0;
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-3xl border border-border bg-bg-soft/60 p-2 sm:p-4">
        <div className="relative aspect-[4/3] w-full">
        {photoUrl
          ? <img src={photoUrl} alt={lang ? "চিংড়ির খোলসের ছবি" : "Shrimp shell"} className="h-full w-full rounded-2xl object-contain" />
          : <svg viewBox="0 0 800 600" className="h-full w-full" role="img" aria-label={lang ? "চিংড়ির খোলসের চিত্র" : "Illustration of a shrimp shell"}>
          <defs>
            <linearGradient id="shellHead" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(var(--coral-soft))" />
              <stop offset="1" stopColor="rgb(var(--coral))" />
            </linearGradient>
            <linearGradient id="shellPlate" x1="0" y1="0" x2="0.9" y2="1">
              <stop offset="0" stopColor="rgb(var(--coral-soft))" />
              <stop offset="1" stopColor="rgb(var(--coral))" />
            </linearGradient>
            <linearGradient id="shellFiber" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="rgb(var(--teal-light))" />
              <stop offset="1" stopColor="rgb(var(--ocean-deep))" />
            </linearGradient>
          </defs>
          <ellipse cx="410" cy="500" rx="290" ry="35" fill="rgb(var(--ocean-deep))" opacity=".12" />
          <g stroke="rgb(var(--coral-text))" strokeWidth="5" strokeLinejoin="round" style={{ filter: "drop-shadow(0 14px 14px rgb(var(--shadow-card) / .18))" }}>
            <path d="M99 285 41 244 102 254 71 192 132 235 133 172 172 228 206 171 216 237 278 205 253 270Z" fill="url(#shellHead)" />
            <path d="M149 247c23-93 119-140 220-116 35 8 65 33 86 67l-28 113c-67 56-177 59-256 25-24-11-34-52-22-89Z" fill="url(#shellHead)" />
            <path d="M410 236c34-37 70-43 100-25l-15 142c-32 22-64 16-94-13Z" fill="url(#shellPlate)" />
            <path d="M488 215c34-26 64-23 89 1l-16 152c-31 19-60 9-87-15Z" fill="url(#shellPlate)" />
            <path d="M565 218c32-17 60-7 79 22l-19 133c-27 13-53 3-73-22Z" fill="url(#shellPlate)" />
            <path d="M636 241c28-7 48 9 60 39l-21 91c-23 9-42-4-57-30Z" fill="url(#shellPlate)" />
            <path d="M695 278c24 0 38 17 40 45l-27 55c-20 4-35-11-39-34Z" fill="url(#shellPlate)" />
            <path d="M729 325c24 8 32 25 24 50l-40 42c-20-3-29-20-24-40Z" fill="url(#shellPlate)" />
          </g>
          <g fill="none" stroke="rgb(var(--coral-text))" strokeWidth="5" strokeLinecap="round">
            <path d="M747 370 792 318M748 375 798 355M741 386 790 395" />
            <path d="M156 236c-38-58-78-92-119-102M173 228c-18-76-43-125-76-156" opacity=".65" />
          </g>
          <path d="M239 266c52-56 135-70 204-29-14 58-44 104-94 126-51 21-98-3-110-44Z" fill="url(#shellFiber)" stroke="rgb(var(--teal))" strokeWidth="5" opacity=".9" />
          <path d="M265 271c40-32 91-40 137-25M273 293c41-29 83-34 123-23M285 314c33-19 67-23 101-16" stroke="rgb(var(--surface))" strokeWidth="6" strokeLinecap="round" opacity=".7" />
          <circle cx="180" cy="258" r="9" fill="rgb(var(--ink))" />
          <path d="M144 272c20 17 38 19 55 9" fill="none" stroke="rgb(var(--coral-text))" strokeWidth="5" strokeLinecap="round" />
          <g transform="translate(528 52)">
            <circle cx="102" cy="92" r="86" fill="rgb(var(--surface))" stroke="rgb(var(--teal))" strokeWidth="4" />
            <path d="M39 61c36-37 89-45 128-15M42 77c40-31 83-32 122-11M48 99c31-18 70-19 107-3" fill="none" stroke="url(#shellFiber)" strokeWidth="11" strokeLinecap="round" />
            <path d="M43 119c41 21 82 25 119 11" fill="none" stroke="rgb(var(--coral))" strokeWidth="13" strokeLinecap="round" />
            <path d="M49 141c34 15 69 18 104 8" fill="none" stroke="rgb(var(--sand))" strokeWidth="16" strokeLinecap="round" />
            <text x="102" y="198" textAnchor="middle" fill="rgb(var(--ink))" fontSize="15" fontFamily="sans-serif">{lang ? "খোলসের স্তর" : "Shell layers"}</text>
          </g>
          </svg>}
        {parts.map((part) => (
          <button
            key={part.key}
            type="button"
            aria-label={lang ? part.name_bn : part.name_en}
            aria-pressed={selected.key === part.key}
            onClick={() => setSelectedKey(part.key)}
            className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white shadow-lg transition ${selected.key === part.key ? "scale-110 bg-teal text-white" : "animate-pulse bg-coral text-coral-ink"}`}
            style={{ left: `${part.hotspot_x}%`, top: `${part.hotspot_y}%` }}
          >
            +
          </button>
        ))}
        </div>
      </div>
      <div className="card p-5" aria-live="polite">
        <h3 className="font-display text-lg font-semibold text-ink">{lang ? selected.name_bn : selected.name_en}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{lang ? selected.description_bn : selected.description_en}</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-ink-muted">
          {[lang ? "প্রোটিনের পাতলা স্তর" : "Thin protein surface", lang ? "কাইটিন-প্রোটিন তন্তু" : "Chitin-protein fiber", lang ? "খনিজ স্তর" : "Mineral layer"].map((layer, index) => (
            <div key={layer} className="rounded-lg border border-border p-2">
              <span className={`mx-auto mb-2 block h-2 w-10 rounded-full ${index === 0 ? "bg-coral" : index === 1 ? "bg-teal" : "bg-sand"}`} />
              {layer}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ShellStory({ products }: { products: Product[] }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "bn" ? "bn" : "en";
  const partsQ = useQuery({ queryKey: ["shell_parts"], queryFn: () => listSimple<ShellPart>("shell_parts") });
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const parts = partsQ.data?.length ? partsQ.data : defaultParts;
  const photoUrl = settingsQ.data?.shell_story?.use_illustration === false ? settingsQ.data.shell_story.image_url : "";
  const process = lang === "bn" ? ["ধোয়া", "শুকানো", "গুঁড়া করা"] : ["Wash", "Dry", "Grind"];
  return (
    <Section>
      <SectionHeading
        eyebrow={lang === "bn" ? "খোলসের গল্প" : "The Shell Story"}
        title={lang === "bn" ? "চিংড়ির খোলসের কোন অংশ আমরা ব্যবহার করি?" : "Which Part Of The Shrimp Shell Do We Use?"}
        body={lang === "bn" ? "ফেলে দেওয়া খোলস থেকে স্থানীয়ভাবে উপযোগী উপাদান তৈরি করি।" : "We turn discarded shells into useful materials through local preparation."}
      />
      <div className="mt-8 grid items-start gap-8 lg:grid-cols-2">
        <ShrimpShellIllustration parts={parts} photoUrl={photoUrl} />
        <div className="space-y-5">
          <article className="card p-5">
            <h3 className="font-display text-xl font-semibold text-ink">{lang === "bn" ? "চিংড়ির খোলস কী দিয়ে তৈরি" : "What A Shrimp Shell Is Made Of"}</h3>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-ink-muted">
              <li><strong className="text-ink">Chitin:</strong> can be processed into chitosan for the filter, ChitoClear, and Agri Powder.</li>
              <li><strong className="text-ink">Minerals, mostly calcium:</strong> can contribute to calcium powder and shell crafts or jewelry.</li>
              <li><strong className="text-ink">Protein and whole ground shell:</strong> used in the concept for Shonjibon Soyad flour.</li>
            </ul>
            <p className="mt-4 rounded-xl border border-coral/30 bg-coral-soft/30 p-3 text-sm font-medium text-coral-text">
              {lang === "bn" ? "অ্যালার্জি সতর্কতা: শেলফিশ অ্যালার্জি থাকলে চিংড়ি থেকে তৈরি ময়দা/খাদ্য উপাদান এড়িয়ে চলুন।" : "Shellfish allergen warning: people with shellfish allergy should avoid flour or food ingredients made from shrimp shells."}
            </p>
          </article>
          <article className="card p-5">
            <h3 className="font-display text-lg font-semibold text-ink">{lang === "bn" ? "কেন আমরা খোলস ব্যবহার করি" : "Why We Use Shells"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {lang === "bn" ? "খোলস প্রতিদিন ফেলে দেওয়া হয়। এটি স্থানীয়ভাবে পাওয়া যায়, কম খরচে সংগ্রহ করা যায় এবং নতুন করে চাষের দরকার হয় না।" : "Shells are thrown away every day. They are locally available, low cost to collect, and require no additional farming."}
            </p>
            <h4 className="mt-5 text-sm font-semibold text-ink">{lang === "bn" ? "আমরা কীভাবে প্রস্তুত করি" : "How We Prepare It"}</h4>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {process.map((step, index) => <div key={step} className="rounded-xl bg-bg-soft p-3 text-center text-sm font-medium text-ink"><span className="mb-1 block text-xl text-teal-dark">{["⌁", "☼", "✳"][index]}</span>{step}</div>)}
            </div>
          </article>
        </div>
      </div>
      <div className="mt-10">
        <h3 className="font-display text-xl font-semibold text-ink">{lang === "bn" ? "এক খোলস, পাঁচ পণ্য" : "One Shell, Five Products"}</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {products.slice(0, 5).map((product) => (
            <Link to={`/products/${product.slug}`} key={product.id} className="card p-4 transition hover:-translate-y-0.5 hover:shadow-lg">
              <img src={product.cover_image} alt="" className="mb-3 aspect-[4/3] w-full rounded-xl object-cover" loading="lazy" />
              <p className="font-semibold text-ink">{t2(product, "name", lang)}</p>
            </Link>
          ))}
        </div>
      </div>
    </Section>
  );
}
