import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Product } from "@/lib/types";
import { formatCurrency, t2 } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { Img } from "@/components/shared";

export function StockBadge({ status }: { status: Product["stock_status"] }) {
  const { t } = useTranslation();
  const tone = status === "in_stock" ? "teal" : status === "out_of_stock" ? "coral" : "sand";
  return <Badge tone={tone as "teal" | "coral" | "sand"}>{t(`common.stock.${status}`)}</Badge>;
}

export function ProductCard({ product, large = false }: { product: Product; large?: boolean }) {
  const { i18n, t } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";

  return (
    <Link
      to={`/products/${product.slug}`}
      className={`card group flex flex-col overflow-hidden transition hover:shadow-md ${large ? "sm:col-span-2 sm:flex-row" : ""}`}
    >
      <div className={large ? "sm:w-1/2" : ""}>
        <Img
          src={product.cover_image}
          alt={t2(product, "name", lang)}
          className={`h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02] ${large ? "sm:h-full" : ""}`}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          {product.is_flagship && <Badge tone="coral">{lang === "bn" ? "ফ্ল্যাগশিপ" : "Flagship"}</Badge>}
          <StockBadge status={product.stock_status} />
        </div>
        <h3 className={`font-display font-semibold text-ink ${large ? "text-2xl" : "text-lg"}`}>{t2(product, "name", lang)}</h3>
        <p className="text-sm leading-relaxed text-ink-muted">{t2(product, "tagline", lang)}</p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <div className="flex items-baseline gap-2">
            {product.sale_price != null && <Badge tone="coral">Sale</Badge>}
            <span className="text-base font-semibold text-teal-dark">{formatCurrency(product.sale_price ?? product.price, product.currency, lang)}</span>
            {product.sale_price != null && <span className="text-xs text-ink-muted line-through">{formatCurrency(product.price, product.currency, lang)}</span>}
          </div>
          <span className="text-sm font-medium text-ink underline-offset-4 group-hover:underline">{t("actions.viewDetails")}</span>
        </div>
      </div>
    </Link>
  );
}

export function ProductGallery({ product }: { product: Product }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const images = product.images.length ? product.images : [{ id: "cover", url: product.cover_image, alt_en: product.name_en, alt_bn: product.name_bn, sort_order: 0 }];
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-border bg-bg-soft">
        <Img src={current.url} alt={t2(current, "alt", lang)} className="aspect-[4/3] w-full object-cover" width={800} height={600} />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActive(idx)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${idx === active ? "border-teal" : "border-transparent"}`}
            >
              <img src={img.url} alt="" className="h-full w-full object-cover" width={64} height={64} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function SpecTable({ specs }: { specs: Product["specs"] }) {
  const { i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  if (!specs.length) return null;
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full text-sm">
        <tbody>
          {specs.map((spec, idx) => (
            <tr key={spec.id} className={idx % 2 === 0 ? "bg-surface" : "bg-bg-soft/60"}>
              <th className="w-1/3 px-4 py-3 text-left font-medium text-ink-muted">{t2(spec, "label", lang)}</th>
              <td className="px-4 py-3 text-ink">{t2(spec, "value", lang)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProcessSteps({ steps }: { steps: Product["process_steps"] }) {
  const { i18n, t } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  if (!steps.length) return null;
  return (
    <div>
      <h3 className="mb-5 font-display text-xl font-semibold text-ink">{t("products.howMade")}</h3>
      <div className="grid gap-4 sm:grid-cols-4">
        {steps
          .slice()
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((step) => (
            <div key={step.id} className="card p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-teal/10 text-sm font-bold text-teal-dark">
                {step.step_no}
              </div>
              <p className="font-medium text-ink">{t2(step, "title", lang)}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">{t2(step, "body", lang)}</p>
            </div>
          ))}
      </div>
    </div>
  );
}

export function BenefitCards({ benefits }: { benefits: Product["benefits"] }) {
  const { i18n, t } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  if (!benefits.length) return null;
  return (
    <div>
      <h3 className="mb-5 font-display text-xl font-semibold text-ink">{t("products.benefits")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {benefits.map((b) => (
          <div key={b.id} className="card flex items-start gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral-soft text-coral-text">
              <BenefitIcon name={b.icon} />
            </div>
            <div>
              <p className="font-medium text-ink">{t2(b, "title", lang)}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{t2(b, "body", lang)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BenefitIcon({ name }: { name: string }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
  switch (name) {
    case "bolt-off":
      return (
        <svg {...common}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" strokeLinejoin="round" />
        </svg>
      );
    case "coins":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="6" />
          <path d="M15 13.5A6 6 0 1 0 9 19.5" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 21c8 0 14-6 14-14V5h-2C9 5 5 11 5 19v2Z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9Z" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M12 2 2 7l10 5 10-5-10-5Z" />
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
  }
}
