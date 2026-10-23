import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { listSimple } from "@/lib/api";
import { Section, SectionHeading, SEO } from "@/components/shared";
import type { PageSection } from "@/lib/types";
import { t2 } from "@/lib/utils";

const defaults: Record<"terms" | "privacy" | "refund" | "shipping", { en: string; bn: string; bodyEn: string; bodyBn: string }> = {
  terms: {
    en: "Terms And Conditions",
    bn: "শর্তাবলী",
    bodyEn: "Please contact Shonjibon before placing an order if you need product safety, availability, or use information. Product information is provided for general guidance and is not a substitute for professional water testing or public-health advice.",
    bodyBn: "পণ্যের নিরাপত্তা, প্রাপ্যতা বা ব্যবহার সম্পর্কে জানতে অর্ডারের আগে সঞ্জীবনের সাথে যোগাযোগ করুন। পণ্যের তথ্য সাধারণ নির্দেশনার জন্য; এটি পেশাদার পানি পরীক্ষা বা জনস্বাস্থ্য পরামর্শের বিকল্প নয়।",
  },
  privacy: {
    en: "Privacy Policy",
    bn: "গোপনীয়তা নীতি",
    bodyEn: "We use information submitted through forms and checkout to respond to requests and process orders. Contact the site team to request access, correction, or deletion of personal information, subject to legal record-keeping requirements.",
    bodyBn: "ফর্ম ও চেকআউটে দেওয়া তথ্য অনুরোধের উত্তর ও অর্ডার প্রক্রিয়াকরণে ব্যবহার করা হয়। আইনি রেকর্ড সংরক্ষণের বাধ্যবাধকতা সাপেক্ষে ব্যক্তিগত তথ্য দেখা, সংশোধন বা মুছে ফেলার অনুরোধে সাইট টিমের সাথে যোগাযোগ করুন।",
  },
  refund: {
    en: "Refund And Returns",
    bn: "ফেরত ও রিফান্ড",
    bodyEn: "Contact us with your order number as soon as possible if an item arrives damaged or incorrect. We will review the request and explain the available replacement or refund options before processing.",
    bodyBn: "পণ্য ক্ষতিগ্রস্ত বা ভুল হলে অর্ডার নম্বরসহ যত দ্রুত সম্ভব যোগাযোগ করুন। প্রক্রিয়াকরণের আগে আমরা অনুরোধ পর্যালোচনা করে প্রতিস্থাপন বা রিফান্ডের সুযোগ জানাব।",
  },
  shipping: {
    en: "Shipping Policy",
    bn: "শিপিং নীতি",
    bodyEn: "Delivery availability, fees, and estimated times are confirmed during order processing. We will contact you if the delivery address cannot be served or if an estimated delivery window changes.",
    bodyBn: "ডেলিভারির সুযোগ, ফি ও আনুমানিক সময় অর্ডার প্রক্রিয়ার সময় নিশ্চিত করা হয়। ঠিকানায় ডেলিভারি সম্ভব না হলে বা সময় পরিবর্তন হলে আমরা যোগাযোগ করব।",
  },
};

export default function LegalPage({ pageKey }: { pageKey: keyof typeof defaults }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "bn" ? "bn" : "en";
  const fallback = defaults[pageKey];
  const query = useQuery({
    queryKey: ["page_sections", pageKey],
    queryFn: () => listSimple<PageSection>("page_sections", { pageKey }),
  });
  const section = query.data?.[0];
  const title = section ? t2(section, "title", lang) : fallback[lang];
  const body = section ? t2(section, "body", lang) : fallback[lang === "bn" ? "bodyBn" : "bodyEn"];
  return (
    <>
      <SEO title={title} />
      <Section>
        <SectionHeading title={title} align="center" />
        {query.isError ? (
          <p role="alert" className="mx-auto mt-8 max-w-3xl rounded-xl border border-coral/40 bg-coral-soft p-4 text-sm text-ink">
            {lang === "bn" ? "এই নীতি লোড করা যায়নি। পরে আবার চেষ্টা করুন।" : "This policy could not be loaded. Please try again later."}
          </p>
        ) : (
          <article className="card mx-auto mt-8 max-w-3xl whitespace-pre-line p-6 text-sm leading-relaxed text-ink-muted sm:p-8">{body}</article>
        )}
      </Section>
    </>
  );
}
