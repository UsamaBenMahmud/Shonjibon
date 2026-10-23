import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listSimple } from "@/lib/api";
import type { ResearchItem } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { Section, SectionHeading, SEO, Img } from "@/components/shared";
import { Badge } from "@/components/ui";

const layers = [
  { en: "Fine sand", bn: "সূক্ষ্ম বালি", color: "#F3EADB" },
  { en: "Chitosan cartridge", bn: "কাইটোসান কার্তুজ", color: "#1A9AA8" },
  { en: "Activated charcoal", bn: "সক্রিয় কাঠকয়লা", color: "#0B3F4F" },
  { en: "Sand", bn: "বালি", color: "#F3EADB" },
  { en: "Coarse gravel", bn: "মোটা নুড়িপাথর", color: "#D6E6E6" },
];

export default function Research() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const itemsQ = useQuery({ queryKey: ["research_items"], queryFn: () => listSimple<ResearchItem>("research_items") });
  const items = itemsQ.data ?? [];
  const methods = items.filter((i) => i.type === "method");
  const findings = items.filter((i) => i.type === "finding");
  const limitations = items.filter((i) => i.type === "limitation");

  return (
    <>
      <SEO title={t("research.title")} description={t("research.subtitle")} />
      <Section>
        <SectionHeading title={t("research.title")} body={t("research.subtitle")} align="center" />
      </Section>

      <Section className="bg-bg-soft/60">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">{t("research.extractionTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {methods.map((m) => (
            <div key={m.id} className="card space-y-3 p-4">
              <Img src={m.image} alt={t2(m, "title", lang)} className="h-28 w-full rounded-xl object-cover" width={260} height={112} />
              <p className="font-medium text-ink">{t2(m, "title", lang)}</p>
              <p className="text-sm leading-relaxed text-ink-muted">{t2(m, "body", lang)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">{t("research.filterTitle")}</h2>
        <div className="mx-auto flex max-w-sm flex-col overflow-hidden rounded-2xl border border-border">
          {layers.map((layer) => (
            <div
              key={layer.en}
              className="flex items-center justify-center p-5 text-sm font-medium"
              style={{ backgroundColor: layer.color, color: layer.color === "#F3EADB" || layer.color === "#D6E6E6" ? "#0B3F4F" : "white" }}
            >
              {lang === "bn" ? layer.bn : layer.en}
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-bg-soft/60">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">{t("research.findingsTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {findings.map((f) => (
            <div key={f.id} className="card space-y-2 p-4">
              <Badge tone="teal">{t("common.sample")}</Badge>
              <p className="font-medium text-ink">{t2(f, "title", lang)}</p>
              <p className="text-sm leading-relaxed text-ink-muted">{t2(f, "body", lang)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">{t("research.limitationsTitle")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {limitations.map((l) => (
            <div key={l.id} className="rounded-2xl border border-coral/30 bg-coral-soft/50 p-4">
              <p className="font-medium text-ink">{t2(l, "title", lang)}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t2(l, "body", lang)}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section className="bg-bg-soft/60">
        <div className="mx-auto max-w-2xl rounded-2xl border border-teal/30 bg-surface p-6 text-center">
          <h3 className="font-display text-lg font-semibold text-teal-dark">{t("research.salinityTitle")}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t("research.salinityBody")}</p>
        </div>
      </Section>
    </>
  );
}
