import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { listProducts, listSimple } from "@/lib/api";
import type { ProductCategory } from "@/lib/types";
import { Section, SectionHeading, SEO } from "@/components/shared";
import { ProductCard } from "@/components/product";
import { SkeletonCard } from "@/components/ui";

export default function Products() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const [searchParams, setSearchParams] = useSearchParams();
  const productsQ = useQuery({ queryKey: ["products"], queryFn: listProducts });
  const categoriesQ = useQuery({
    queryKey: ["product_categories"],
    queryFn: () => listSimple<ProductCategory>("product_categories"),
  });
  const activeCategory = searchParams.get("category") ?? "";
  const products = (productsQ.data ?? []).filter((product) =>
    !activeCategory || product.category_id === activeCategory
  );

  return (
    <>
      <SEO title={t("products.title")} description={t("products.subtitle")} />
      <Section>
        <SectionHeading title={t("products.title")} body={t("products.subtitle")} align="center" />
        {(categoriesQ.data ?? []).length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2" aria-label="Product categories">
            <button
              type="button"
              onClick={() => setSearchParams({})}
              aria-pressed={!activeCategory}
              className={`rounded-full border px-4 py-2 text-sm ${!activeCategory ? "border-teal bg-teal/10 font-semibold text-teal-dark" : "border-border text-ink-muted"}`}
            >
              {lang === "bn" ? "সব পণ্য" : "All products"}
            </button>
            {categoriesQ.data?.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setSearchParams({ category: category.id })}
                aria-pressed={activeCategory === category.id}
                className={`rounded-full border px-4 py-2 text-sm ${activeCategory === category.id ? "border-teal bg-teal/10 font-semibold text-teal-dark" : "border-border text-ink-muted"}`}
              >
                {lang === "bn" ? category.name_bn : category.name_en}
              </button>
            ))}
          </div>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {productsQ.isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((p) => <ProductCard key={p.id} product={p} large={p.is_flagship} />)}
        </div>
        {!productsQ.isLoading && products.length === 0 && (
          <p className="mt-8 text-center text-sm text-ink-muted">{lang === "bn" ? "এই বিভাগে এখনো পণ্য নেই।" : "No products are currently in this category."}</p>
        )}
      </Section>
    </>
  );
}
