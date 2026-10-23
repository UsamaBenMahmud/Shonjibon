import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listSimple } from "@/lib/api";
import type { CommunityVisit } from "@/lib/types";
import { t2 } from "@/lib/utils";
import { Section, SectionHeading, SEO, Img, Lightbox } from "@/components/shared";

export default function Community() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const visitsQ = useQuery({ queryKey: ["community_visits"], queryFn: () => listSimple<CommunityVisit>("community_visits") });
  const visits = visitsQ.data ?? [];

  const allPhotos = visits.flatMap((v) => v.photos.map((p) => ({ url: p.url, caption: t2(p, "caption", lang) })));
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <>
      <SEO title={t("community.title")} description={t("community.subtitle")} />
      <Section>
        <SectionHeading title={t("community.title")} body={t("community.subtitle")} align="center" />
      </Section>

      {visits.map((visit) => {
        const offset = visits.slice(0, visits.indexOf(visit)).reduce((sum, v) => sum + v.photos.length, 0);
        return (
          <Section key={visit.id} className="pt-0">
            <h2 className="mb-1 font-display text-xl font-semibold text-ink">{t2(visit, "title", lang)}</h2>
            <p className="mb-5 text-sm text-ink-muted">{t2(visit, "description", lang)}</p>
            <div className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3">
              {visit.photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setActiveIndex(offset + idx)}
                  className="block w-full overflow-hidden rounded-xl border border-border focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <Img src={photo.url} alt={t2(photo, "caption", lang)} className="w-full object-cover" width={320} height={240} />
                </button>
              ))}
            </div>
          </Section>
        );
      })}

      <Lightbox images={allPhotos} index={activeIndex} onClose={() => setActiveIndex(null)} onNavigate={setActiveIndex} />
    </>
  );
}
