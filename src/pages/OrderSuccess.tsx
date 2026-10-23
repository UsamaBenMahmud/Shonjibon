import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Section, SEO } from "@/components/shared";
import { toBanglaDigits } from "@/lib/utils";

export default function OrderSuccess() {
  const { orderNo = "" } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage;
  const [searchParams] = useSearchParams();
  const paymentResult = searchParams.get("payment");

  return (
    <>
      <SEO title={t("orderSuccess.title")} />
      <Section>
        <div className="mx-auto max-w-md rounded-2xl border border-teal/30 bg-surface p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal/10 text-3xl">✓</div>
          <h1 className="font-display text-2xl font-semibold text-ink">{t("orderSuccess.title")}</h1>
          <p className="mt-3 text-ink-muted">
            {t("orderSuccess.body")} <span className="font-semibold text-teal-dark">{lang === "bn" ? toBanglaDigits(orderNo) : orderNo}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">{t("orderSuccess.callConfirm")}</p>
          {paymentResult === "success" && (
            <p role="status" className="mt-3 rounded-lg bg-teal/10 p-3 text-sm text-teal-dark">
              Online payment was returned successfully. The server is verifying the transaction; check your account for the confirmed status.
            </p>
          )}
          {(paymentResult === "failed" || paymentResult === "cancelled") && (
            <p role="alert" className="mt-3 rounded-lg bg-coral/10 p-3 text-sm text-coral-text">
              Payment was not confirmed ({paymentResult}). Your order is saved as pending; contact support or check your account.
            </p>
          )}
          <Link to="/account" className="mt-4 inline-flex text-sm font-medium text-teal-dark underline">View account and orders</Link>
          <Link to="/products" className="btn-primary mt-6 inline-flex">
            {t("actions.continueShopping")}
          </Link>
        </div>
      </Section>
    </>
  );
}
