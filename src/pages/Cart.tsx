import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { Section, SectionHeading, SEO } from "@/components/shared";
import { Button, EmptyState } from "@/components/ui";

export default function Cart() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const navigate = useNavigate();

  return (
    <>
      <SEO title={t("cart.title")} />
      <Section>
        <SectionHeading title={t("cart.title")} />
        {lines.length === 0 ? (
          <div className="mt-8">
            <EmptyState title={t("cart.empty")} icon="🛒" />
            <div className="mt-6 text-center">
              <Link to="/products" className="btn-primary">{t("cart.goShopping")}</Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            <div className="space-y-4 sm:col-span-2">
              {lines.map((line) => (
                <div key={line.productId} className="card flex gap-4 p-4">
                  <img src={line.image} alt="" className="h-20 w-20 rounded-xl object-cover" width={80} height={80} />
                  <div className="flex-1 space-y-1">
                    <p className="font-medium text-ink">{lang === "bn" ? line.name_bn : line.name_en}</p>
                    <p className="text-sm text-teal-dark">{formatCurrency(line.price, line.currency, lang)}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.productId, Number(e.target.value) || 1)}
                        className="w-20 rounded-lg border border-border px-2 py-1 text-sm"
                        aria-label={t("common.quantity")}
                      />
                      <button onClick={() => remove(line.productId)} className="text-xs text-coral-text hover:underline">
                        {t("actions.remove")}
                      </button>
                    </div>
                  </div>
                  <p className="font-medium text-ink">{formatCurrency(line.price * line.quantity, line.currency, lang)}</p>
                </div>
              ))}
            </div>
            <div className="card h-fit space-y-4 p-5">
              <div className="flex justify-between text-sm text-ink-muted">
                <span>{t("common.subtotal")}</span>
                <span>{formatCurrency(totalPrice, "BDT", lang)}</span>
              </div>
              <div className="flex justify-between font-semibold text-ink">
                <span>{t("common.total")}</span>
                <span>{formatCurrency(totalPrice, "BDT", lang)}</span>
              </div>
              <Button className="w-full" onClick={() => navigate("/checkout")}>
                {t("actions.checkout")}
              </Button>
              <Link to="/products" className="block text-center text-sm text-teal-dark hover:underline">
                {t("actions.continueShopping")}
              </Link>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
