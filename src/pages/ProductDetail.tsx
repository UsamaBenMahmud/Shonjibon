import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getProductBySlug, listProducts } from "@/lib/api";
import { formatCurrency, t2 } from "@/lib/utils";
import { Section, SectionHeading, SEO, Container } from "@/components/shared";
import { Badge, Button } from "@/components/ui";
import { BenefitCards, ProcessSteps, ProductCard, ProductGallery, SpecTable, StockBadge } from "@/components/product";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { hasSupabase, supabase } from "@/lib/supabase";
import { getMockAccount, updateMockAccount } from "@/lib/mockAccount";

export default function ProductDetail() {
  const { slug = "" } = useParams();
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const productQ = useQuery({ queryKey: ["product", slug], queryFn: () => getProductBySlug(slug) });
  const allProductsQ = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const add = useCartStore((s) => s.add);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const pushToast = useUIStore((s) => s.pushToast);
  const navigate = useNavigate();

  const product = productQ.data;

  const related = useMemo(
    () => (allProductsQ.data ?? []).filter((p) => p.id !== product?.id).slice(0, 3),
    [allProductsQ.data, product?.id]
  );

  const jsonLd = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name_en,
      description: product.overview_en,
      image: product.cover_image,
      offers: {
        "@type": "Offer",
        priceCurrency: product.currency,
        price: product.sale_price ?? product.price,
        availability:
          product.stock_status === "in_stock"
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
      },
    };
  }, [product]);

  if (productQ.isLoading) {
    return <div className="container-px py-20 text-center text-ink-muted">{t("common.loading")}</div>;
  }

  if (!product) {
    return (
      <Section>
        <SectionHeading title={t("notFound.title")} body={t("notFound.body")} align="center" />
        <div className="mt-6 text-center">
          <Link to="/products" className="btn-primary">{t("actions.backToShop")}</Link>
        </div>
      </Section>
    );
  }

  function handleAddToCart() {
    if (!product) return;
    add(
      {
        productId: product.id,
        slug: product.slug,
        name_en: product.name_en,
        name_bn: product.name_bn,
        price: product.sale_price ?? product.price,
        currency: product.currency,
        image: product.cover_image,
        quantity: 1,
      },
      1
    );
    pushToast(lang === "bn" ? "কার্টে যোগ হয়েছে" : "Added to cart", "success");
    setCartOpen(true);
  }

  async function saveToWishlist() {
    if (!product) return;
    try {
      if (hasSupabase && supabase) {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (!data.user) {
          navigate("/account");
          pushToast(lang === "bn" ? "প্রথমে অ্যাকাউন্টে লগইন করুন" : "Sign in to save products", "info");
          return;
        }
        const { error: saveError } = await supabase.from("customer_wishlist")
          .upsert({ user_id: data.user.id, product_id: product.id }, { onConflict: "user_id,product_id" });
        if (saveError) throw saveError;
      } else {
        const account = getMockAccount();
        if (!account) {
          navigate("/account");
          pushToast(lang === "bn" ? "প্রথমে অ্যাকাউন্ট তৈরি করুন" : "Create an account to save products", "info");
          return;
        }
        if (!account.wishlist.includes(product.id)) {
          updateMockAccount({ wishlist: [...account.wishlist, product.id] });
        }
      }
      pushToast(lang === "bn" ? "সংরক্ষিত পণ্যে যোগ হয়েছে" : "Added to saved products", "success");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : (lang === "bn" ? "সংরক্ষণ ব্যর্থ" : "Could not save product"), "error");
    }
  }

  const isFilter = product.slug === "shonjibon-water-filter";
  const isSoyad = product.slug === "shonjibon-soyad";

  return (
    <>
      <SEO title={t2(product, "name", lang)} description={t2(product, "tagline", lang)} image={product.cover_image} />
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
      <Section>
        <div className="grid gap-10 sm:grid-cols-2">
          <ProductGallery product={product} />
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              {product.is_flagship && <Badge tone="coral">{lang === "bn" ? "ফ্ল্যাগশিপ" : "Flagship"}</Badge>}
              <StockBadge status={product.stock_status} />
            </div>
            <h1 className="font-display text-3xl font-semibold text-ink">{t2(product, "name", lang)}</h1>
            <p className="text-lg text-ink-muted">{t2(product, "tagline", lang)}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-teal-dark">{formatCurrency(product.sale_price ?? product.price, product.currency, lang)}</span>
              {product.sale_price != null && <span className="text-sm text-ink-muted line-through">{formatCurrency(product.price, product.currency, lang)}</span>}
              <span className="text-sm text-ink-muted">{t2(product, "price_note", lang)}</span>
            </div>
            <p className="rounded-xl border border-border bg-bg-soft/60 p-3 text-sm text-ink-muted">
              ✓ {t2(product, "trust_line", lang)}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleAddToCart} className="w-full sm:w-auto" disabled={product.stock_status === "out_of_stock"}>
                {t("actions.addToCart")}
              </Button>
              <Button onClick={() => void saveToWishlist()} variant="secondary" className="w-full sm:w-auto">
                {lang === "bn" ? "♡ সংরক্ষণ করুন" : "♡ Save for later"}
              </Button>
            </div>
            <p className="text-sm leading-relaxed text-ink-muted">{t2(product, "overview", lang)}</p>

            {isFilter && (
              <div className="space-y-2 rounded-xl border border-teal/30 bg-teal/5 p-4 text-sm text-ink">
                <p className="font-medium text-teal-dark">{t("filterClaims.line1")}</p>
                <p className="text-ink-muted">{t("filterClaims.line2")}</p>
              </div>
            )}
            {isSoyad && (
              <div className="rounded-xl border border-coral/30 bg-coral-soft/60 p-4 text-sm text-ink">
                <p className="font-semibold text-coral-text">{t("products.allergenTitle")}</p>
                <p className="mt-1 text-ink-muted">
                  {lang === "bn"
                    ? "এই পণ্যে শেলফিশ রয়েছে। শেলফিশ অ্যালার্জি থাকলে ব্যবহার করবেন না।"
                    : "This product contains shellfish. Do not use if you have a shellfish allergy."}
                </p>
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section className="bg-bg-soft/60">
        <ProcessSteps steps={product.process_steps} />
      </Section>

      <Section>
        <BenefitCards benefits={product.benefits} />
      </Section>

      {product.specs.length > 0 && (
        <Section className="bg-bg-soft/60">
          <h3 className="mb-5 font-display text-xl font-semibold text-ink">{t("products.specs")}</h3>
          <SpecTable specs={product.specs} />
        </Section>
      )}

      <Section>
        <Container className="rounded-2xl border border-border bg-surface p-8 text-center">
          <h3 className="font-display text-xl font-semibold text-ink">{t("products.bulkTitle")}</h3>
          <p className="mt-2 text-sm text-ink-muted">{t("products.bulkBody")}</p>
          <Link to="/contact" className="btn-secondary mt-5 inline-flex">
            {t("nav.contact")}
          </Link>
        </Container>
      </Section>

      {related.length > 0 && (
        <Section className="bg-bg-soft/60">
          <SectionHeading title={t("products.related")} />
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
