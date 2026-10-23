import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart";
import { useUIStore } from "@/store/ui";
import { Container, LanguageToggle, Logo, ThemeToggle } from "@/components/shared";
import { Button } from "@/components/ui";
import { bdPhoneHref, formatBdPhone, formatCurrency } from "@/lib/utils";
import { getSettings, listSimple } from "@/lib/api";
import type { NavItem, ProductCategory } from "@/lib/types";
import { makeDefaultNavItems } from "@/lib/pageContent";
import { cn } from "@/utils/cn";

const footerNavItems = [
  { to: "/", key: "home" },
  { to: "/products", key: "products" },
  { to: "/coastal-problem", key: "coastalProblem" },
  { to: "/concerns", key: "concerns" },
  { to: "/health", key: "health" },
  { to: "/research", key: "research" },
  { to: "/lab-results", key: "testing" },
  { to: "/gallery", key: "community" },
  { to: "/news", key: "news" },
  { to: "/team", key: "team" },
  { to: "/about", key: "about" },
  { to: "/faq", key: "faq" },
  { to: "/contact", key: "contact" },
] as const;

let fallbackNavId = 0;
const defaultNavItems = makeDefaultNavItems(() => `fallback-nav-${++fallbackNavId}`);

export function Header() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const navigationQuery = useQuery({ queryKey: ["nav_items"], queryFn: () => listSimple<NavItem>("nav_items") });
  const productCategoriesQuery = useQuery({
    queryKey: ["product_categories"],
    queryFn: () => listSimple<ProductCategory>("product_categories"),
  });
  const settingsQuery = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const cartCount = useCartStore((s) => s.totalCount());
  const menuOpen = useUIStore((s) => s.menuOpen);
  const setMenuOpen = useUIStore((s) => s.setMenuOpen);
  const setCartOpen = useUIStore((s) => s.setCartOpen);
  const baseItems: NavItem[] = navigationQuery.data?.length
    ? navigationQuery.data
    : defaultNavItems;
  const items: NavItem[] = [
    ...baseItems,
    ...(productCategoriesQuery.data ?? []).map((category, index): NavItem => ({
      id: `product-category-${category.id}`,
      parent_id: null,
      label_en: category.name_en,
      label_bn: category.name_bn,
      path: `/products?category=${encodeURIComponent(category.id)}`,
      group_key: "shop",
      description_en: `Browse ${category.name_en.toLowerCase()}.`,
      description_bn: `${category.name_bn} দেখুন।`,
      is_visible: category.is_published,
      sort_order: 100 + index,
    })),
  ];
  const contactPhone = settingsQuery.data?.contact?.phone || settingsQuery.data?.contact_phone || "01620485218";
  const brandName = lang === "bn"
    ? settingsQuery.data?.branding?.name_bn || "সঞ্জীবন"
    : settingsQuery.data?.branding?.name_en || "Shonjibon";

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-xl focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-50 border-b border-border/70 bg-bg/95 backdrop-blur">
        <Container className="flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label={`${brandName} home`} className="shrink-0 font-display text-xl font-bold tracking-tight text-teal-dark sm:text-2xl">
            {brandName}
          </Link>
          <div className="flex items-center gap-2">
            <LanguageToggle className="hidden sm:flex" />
            <ThemeToggle className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-full border border-border bg-surface p-2.5 text-ink transition hover:bg-bg-soft"
              aria-label={t("nav.cart")}
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-coral-ink">
                  {cartCount}
                </span>
              )}
            </button>
            <Link
              to="/account"
              className="rounded-full border border-border bg-surface p-2.5 text-ink transition hover:bg-bg-soft"
              aria-label="My account"
              title="My account"
            >
              <span aria-hidden="true">♙</span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-full border border-border bg-surface p-2.5 text-ink transition hover:bg-bg-soft"
              aria-label={t("nav.menu")}
            >
              <MenuIcon />
            </button>
          </div>
        </Container>
      </header>
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={items}
        lang={lang}
        contactPhone={contactPhone}
        brandName={brandName}
      />
      <CartDrawer />
    </>
  );
}

function MobileMenu({ open, onClose, items, lang, contactPhone, brandName }: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  lang: "bn" | "en";
  contactPhone: string;
  brandName: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<string | null>(null);
  const groups = ["shop", "concerns", "work", "news", "about"] as const;
  const label = (item: NavItem) => lang === "bn" ? item.label_bn || item.label_en : item.label_en || item.label_bn;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-bg" role="dialog" aria-modal="true">
      <Container className="flex h-16 items-center justify-between border-b border-border/70">
        <Link to="/" onClick={onClose} className="font-display text-xl font-bold tracking-tight text-teal-dark">{brandName}</Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <ThemeToggle />
          <button
            onClick={onClose}
            aria-label={t("nav.close")}
            className="rounded-full border border-border bg-surface p-2.5 text-ink hover:bg-bg-soft"
          >
            <CloseIcon />
          </button>
        </div>
      </Container>
      <Container className="grid max-h-[calc(100vh-9rem)] gap-1 overflow-y-auto py-8">
        {items.filter((item) => item.is_visible && !item.group_key).map((item) => (
          <NavLink key={item.id} to={item.path} onClick={onClose} className={({ isActive }) => cn("rounded-xl px-4 py-3.5 text-xl font-medium text-ink transition hover:bg-bg-soft", isActive && "bg-bg-soft text-teal-dark")}>
            {label(item)}
          </NavLink>
        ))}
        {groups.map((group) => {
          const groupTitle = { shop: "Shop", concerns: "Our Concerns", work: "Our Work", news: "News", about: "About" }[group];
          const children = items.filter((item) => item.is_visible && item.group_key === group && item.label_en !== groupTitle);
          if (!children.length) return null;
          const isExpanded = expanded === group;
          return (
            <section key={group} className="border-b border-border">
              <button type="button" aria-expanded={isExpanded} onClick={() => setExpanded(isExpanded ? null : group)} className="flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-xl font-medium text-ink hover:bg-bg-soft">
                {t(`navGroup.${group}`)} <span aria-hidden="true">{isExpanded ? "−" : "+"}</span>
              </button>
              {isExpanded && <div className="grid gap-1 pb-3 pl-3">{children.map((item) => (
                <NavLink key={item.id} to={item.path} onClick={onClose} className="rounded-xl px-4 py-3 text-base font-medium text-ink hover:bg-bg-soft">
                  {label(item)}
                  {item.description_en && <span className="mt-1 block text-sm leading-relaxed text-ink-muted">{lang === "bn" ? item.description_bn || item.description_en : item.description_en}</span>}
                </NavLink>
              ))}</div>}
            </section>
          );
        })}
        <Link to="/admin" onClick={onClose} className="mt-4 px-4 text-sm text-ink-muted hover:text-teal-dark">
          {t("nav.admin")} →
        </Link>
      </Container>
      <div className="fixed inset-x-0 bottom-0 grid grid-cols-2 gap-3 border-t border-border bg-surface p-4">
        <a href={bdPhoneHref(contactPhone)} className="btn-secondary" dir="ltr">☎ {formatBdPhone(contactPhone)}</a>
        <Link to="/cart" onClick={onClose} className="btn-primary">{t("nav.cart")}</Link>
      </div>
    </div>
  );
}

function CartDrawer() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage === "en" ? "en" : "bn";
  const open = useUIStore((s) => s.cartOpen);
  const setOpen = useUIStore((s) => s.setCartOpen);
  const lines = useCartStore((s) => s.lines);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const remove = useCartStore((s) => s.remove);
  const totalPrice = useCartStore((s) => s.totalPrice());
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[65] flex justify-end">
      <button aria-label="Close cart" className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative flex h-full w-full max-w-md flex-col bg-surface p-6 shadow-xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">{t("cart.title")}</h2>
          <button onClick={() => setOpen(false)} aria-label={t("nav.close")} className="rounded-full p-2 hover:bg-bg-soft">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-ink-muted">{t("cart.empty")}</p>
            <Button onClick={() => { setOpen(false); navigate("/products"); }}>{t("cart.goShopping")}</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto">
              {lines.map((line) => (
                <div key={line.productId} className="flex gap-3 rounded-xl border border-border p-3">
                  <img src={line.image} alt="" className="h-16 w-16 rounded-lg object-cover" width={64} height={64} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-ink">{lang === "bn" ? line.name_bn : line.name_en}</p>
                    <p className="text-sm text-teal-dark">{formatCurrency(line.price, line.currency, lang)}</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.productId, Number(e.target.value) || 1)}
                        className="w-16 rounded-lg border border-border px-2 py-1 text-sm"
                        aria-label={t("common.quantity")}
                      />
                      <button onClick={() => remove(line.productId)} className="text-xs text-coral-text hover:underline">
                        {t("actions.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm font-semibold text-ink">
                <span>{t("common.total")}</span>
                <span>{formatCurrency(totalPrice, "BDT", lang)}</span>
              </div>
              <Button className="w-full" onClick={() => { setOpen(false); navigate("/checkout"); }}>
                {t("actions.checkout")}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Footer() {
  const { t } = useTranslation();
  const settingsQ = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const phone = settingsQ.data?.contact?.phone || settingsQ.data?.contact_phone;
  const email = settingsQ.data?.contact?.email || settingsQ.data?.contact_email;
  return (
    <footer className="mt-20 bg-ocean-deep text-white/90">
      <Container className="grid gap-10 py-14 sm:grid-cols-3">
        <div className="space-y-3">
          <Logo className="[&_span]:text-white" />
          <p className="max-w-xs text-sm leading-relaxed text-white/70">{t("footer.tagline")}</p>
          <p className="text-xs text-white/50">{t("footer.program")}</p>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">{t("footer.links")}</p>
          <ul className="space-y-2 text-sm text-white/70">
            {footerNavItems.slice(0, 6).map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="hover:text-white">
                  {t(`nav.${item.key}`)}
                </Link>
              </li>
            ))}
            <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
            <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
            <li><Link to="/refund-policy" className="hover:text-white">Refund And Returns</Link></li>
            <li><Link to="/shipping-policy" className="hover:text-white">Shipping Policy</Link></li>
          </ul>
        </div>
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white">{t("footer.contact")}</p>
          {email && <a href={`mailto:${email}`} className="text-sm text-white/70 hover:text-white">{email}</a>}
          {phone && <a href={bdPhoneHref(phone)} className="text-sm text-white/70 hover:text-white" dir="ltr">{formatBdPhone(phone)}</a>}
          {settingsQ.data?.contact?.whatsapp_enabled && phone && (
            <a href={`https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "880")}`} target="_blank" rel="noreferrer" className="text-sm text-white/70 hover:text-white">{t("contact.whatsapp")}</a>
          )}
          <Link to="/admin" className="inline-block text-xs text-white/40 hover:text-white/70">
            {t("nav.admin")}
          </Link>
        </div>
      </Container>
      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} সঞ্জীবন Shonjibon — {t("footer.rights")}
      </div>
    </footer>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.5 2.5h2l2.4 12.2a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}
