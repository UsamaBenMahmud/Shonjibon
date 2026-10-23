import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useCartStore } from "@/store/cart";
import { createOrder } from "@/lib/api";
import { checkoutSchema, type CheckoutInput } from "@/lib/schemas";
import { formatCurrency } from "@/lib/utils";
import { Section, SectionHeading, SEO } from "@/components/shared";
import { Button, FieldWrap, Input, Textarea } from "@/components/ui";
import { useUIStore } from "@/store/ui";
import { hasSupabase, supabase } from "@/lib/supabase";
import { getMockAccount } from "@/lib/mockAccount";

type SavedAddress = {
  id: string;
  label: string;
  recipient_name: string;
  phone: string;
  address: string;
  district: string;
  is_default: boolean;
};

export default function Checkout() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const lines = useCartStore((s) => s.lines);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const clearCart = useCartStore((s) => s.clear);
  const pushToast = useUIStore((s) => s.pushToast);
  const navigate = useNavigate();
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { payment_method: "cash_on_delivery" },
  });

  useEffect(() => {
    async function loadAddresses() {
      try {
        if (hasSupabase && supabase) {
          const { data: auth, error: authError } = await supabase.auth.getUser();
          if (authError) throw authError;
          if (!auth.user) return;
          const { data, error } = await supabase.from("customer_addresses")
            .select("id,label,recipient_name,phone,address,district,is_default")
            .eq("user_id", auth.user.id)
            .order("created_at");
          if (error) throw error;
          setSavedAddresses((data ?? []) as SavedAddress[]);
        } else {
          setSavedAddresses(getMockAccount()?.addresses ?? []);
        }
      } catch (error) {
        pushToast(error instanceof Error
          ? `ঠিকানা লোড হয়নি / Could not load saved addresses: ${error.message}`
          : "ঠিকানা লোড হয়নি / Could not load saved addresses", "error");
      }
    }
    void loadAddresses();
  }, [pushToast]);

  function applySavedAddress(id: string) {
    const address = savedAddresses.find((item) => item.id === id);
    if (!address) return;
    setValue("customer_name", address.recipient_name, { shouldValidate: true });
    setValue("phone", address.phone, { shouldValidate: true });
    setValue("address", address.address, { shouldValidate: true });
    setValue("district", address.district, { shouldValidate: true });
  }

  async function onSubmit(values: CheckoutInput) {
    if (values.company) return; // honeypot
    if (lines.length === 0) {
      pushToast(lang === "bn" ? "কার্ট খালি" : "Cart is empty", "error");
      return;
    }
    try {
      const result = await createOrder({
        customer_name: values.customer_name,
        phone: values.phone,
        email: values.email,
        address: values.address,
        district: values.district,
        note: values.note,
        payment_method: values.payment_method,
        items: lines.map((line) => ({ product_id: line.productId, quantity: line.quantity })),
      });
      clearCart();
      if (result.paymentUrl) {
        window.location.assign(result.paymentUrl);
        return;
      }
      navigate(`/order-success/${result.orderNo}`);
    } catch (error) {
      pushToast(error instanceof Error
        ? `অর্ডার করা যায়নি / Could not place the order: ${error.message}`
        : "অর্ডার করা যায়নি / Could not place the order", "error");
    }
  }

  if (lines.length === 0) {
    return (
      <Section>
        <SectionHeading title={t("checkout.title")} body={t("cart.empty")} align="center" />
      </Section>
    );
  }

  return (
    <>
      <SEO title={t("checkout.title")} />
      <Section>
        <SectionHeading title={t("checkout.title")} body={t("checkout.subtitle")} />
        <div className="mt-8 grid gap-10 sm:grid-cols-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:col-span-3" noValidate>
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" {...register("company")} />
            <h3 className="font-display text-lg font-semibold text-ink">{t("checkout.customerDetails")}</h3>
            {savedAddresses.length > 0 && (
              <FieldWrap label="Use saved delivery address / সংরক্ষিত ঠিকানা ব্যবহার করুন">
                <select className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-ink" defaultValue="" onChange={(event) => applySavedAddress(event.target.value)}>
                  <option value="">Choose an address</option>
                  {savedAddresses.map((address) => (
                    <option key={address.id} value={address.id}>{address.label} — {address.address}, {address.district}{address.is_default ? " (Default)" : ""}</option>
                  ))}
                </select>
              </FieldWrap>
            )}
            <FieldWrap label={t("checkout.fullName")} required error={errors.customer_name?.message}>
              <Input {...register("customer_name")} error={!!errors.customer_name} />
            </FieldWrap>
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldWrap label={t("checkout.phone")} required error={errors.phone?.message}>
                <Input {...register("phone")} error={!!errors.phone} />
              </FieldWrap>
              <FieldWrap label={t("checkout.email")} error={errors.email?.message}>
                <Input type="email" {...register("email")} />
              </FieldWrap>
            </div>
            <FieldWrap label={t("checkout.address")} required error={errors.address?.message}>
              <Textarea rows={3} {...register("address")} error={!!errors.address} />
            </FieldWrap>
            <FieldWrap label={t("checkout.district")} required error={errors.district?.message}>
              <Input {...register("district")} error={!!errors.district} />
            </FieldWrap>
            <FieldWrap label={t("checkout.note")}>
              <Textarea rows={2} {...register("note")} />
            </FieldWrap>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-ink">Payment method / পেমেন্ট পদ্ধতি</legend>
              <label className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm text-ink">
                <input type="radio" value="cash_on_delivery" {...register("payment_method")} className="mt-1 accent-teal" />
                <span>Cash on delivery / ক্যাশ অন ডেলিভারি</span>
              </label>
              <label className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm text-ink">
                <input type="radio" value="mobile_money" {...register("payment_method")} className="mt-1 accent-teal" />
                <span>Mobile payment after order confirmation / অর্ডার নিশ্চিত হলে মোবাইল পেমেন্ট</span>
              </label>
              <label className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm text-ink">
                <input type="radio" value="bank_transfer" {...register("payment_method")} className="mt-1 accent-teal" />
                <span>Bank transfer after order confirmation / অর্ডার নিশ্চিত হলে ব্যাংক ট্রান্সফার</span>
              </label>
              <label className="flex items-start gap-2 rounded-xl border border-border p-3 text-sm text-ink">
                <input type="radio" value="sslcommerz" {...register("payment_method")} className="mt-1 accent-teal" />
                <span>Pay online securely with SSLCommerz / SSLCommerz দিয়ে অনলাইনে পেমেন্ট</span>
              </label>
              <p className="text-xs text-ink-muted">
                Online gateway checkout is available only after SSLCommerz sandbox/live credentials are configured.
                Manual mobile or bank payments are confirmed by staff.
              </p>
            </fieldset>
            <p className="rounded-xl border border-border bg-bg-soft/60 p-3 text-sm text-ink-muted">{t("checkout.paymentNote")}</p>
            <FieldWrap error={errors.termsAccepted?.message}>
              <label className="flex items-start gap-2 text-sm leading-relaxed text-ink">
                <input type="checkbox" {...register("termsAccepted")} className="mt-1 accent-teal" />
                <span>I agree to the <a href="/terms" className="font-semibold text-teal-dark underline">Terms</a> and <a href="/refund-policy" className="font-semibold text-teal-dark underline">Refund Policy</a>.</span>
              </label>
            </FieldWrap>
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
              {t("actions.placeOrder")}
            </Button>
          </form>
          <div className="card h-fit space-y-3 p-5 sm:col-span-2">
            <h3 className="font-display text-lg font-semibold text-ink">{t("checkout.orderSummary")}</h3>
            {lines.map((l) => (
              <div key={l.productId} className="flex justify-between text-sm text-ink-muted">
                <span>
                  {lang === "bn" ? l.name_bn : l.name_en} × {l.quantity}
                </span>
                <span>{formatCurrency(l.price * l.quantity, l.currency, lang)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-3 font-semibold text-ink">
              <span>{t("common.total")}</span>
              <span>{formatCurrency(totalPrice, "BDT", lang)}</span>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
