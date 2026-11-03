import { NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { LanguageToggle, Logo, ThemeToggle } from "@/components/shared";
import { Toaster } from "@/components/ui/Toast";
import { listMessagesAdmin, listOrdersAdmin, listArticlesAdmin } from "@/lib/api";
import { cn } from "@/utils/cn";
import { adminHref } from "@/lib/adminPath";

const navGroups: { label: string; items: { to: string; label: string }[] }[] = [
  { label: "Overview", items: [{ to: "", label: "ড্যাশবোর্ড / Dashboard" }, { to: "settings", label: "সেটিংস / Settings" }, { to: "health", label: "স্বাস্থ্য পরীক্ষা / Health check" }] },
  {
    label: "Content",
    items: [
      { to: "products", label: "পণ্য / Products" },
      { to: "articles", label: "নিবন্ধ / Articles" },
      { to: "page-sections", label: "পৃষ্ঠা বিভাগ / Page sections" },
      { to: "site-text", label: "সাইটের লেখা / Site Text" },
      { to: "navigation", label: "নেভিগেশন / Navigation" },
      { to: "shell-story", label: "খোলসের গল্প / Shell Story" },
      { to: "categories", label: "বিভাগ / Categories" },
      { to: "product-categories", label: "পণ্য বিভাগ / Product categories" },
      { to: "team", label: "টিম / Team" },
      { to: "journey", label: "যাত্রা / Journey" },
      { to: "research", label: "গবেষণা / Research" },
      { to: "testing", label: "পরীক্ষার ফলাফল / Test results" },
      { to: "impact", label: "প্রভাব / Impact stats" },
      { to: "community", label: "কমিউনিটি / Community" },
      { to: "testimonials", label: "মতামত / Testimonials" },
      { to: "faqs", label: "প্রশ্নোত্তর / FAQs" },
      { to: "partners", label: "অংশীদার / Partners" },
      { to: "downloads", label: "ডাউনলোড / Downloads" },
      { to: "media", label: "মিডিয়া / Media" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "orders", label: "অর্ডার / Orders" },
      { to: "messages", label: "বার্তা / Messages" },
      { to: "subscribers", label: "সাবস্ক্রাইবার / Subscribers" },
      { to: "audit", label: "অডিট লগ / Audit log" },
      { to: "users", label: "ব্যবহারকারী / Users" },
    ],
  },
];

export default function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const ordersQ = useQuery({ queryKey: ["orders-admin"], queryFn: listOrdersAdmin });
  const messagesQ = useQuery({ queryKey: ["messages"], queryFn: listMessagesAdmin });
  const articlesQ = useQuery({ queryKey: ["articles-admin"], queryFn: listArticlesAdmin });

  const newOrders = (ordersQ.data ?? []).filter((o) => o.status === "new").length;
  const unread = (messagesQ.data ?? []).filter((m) => !m.is_read).length;
  const drafts = (articlesQ.data ?? []).filter((a) => a.status === "draft").length;

  return (
    <div className="flex min-h-screen bg-bg-soft">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface p-5 sm:flex">
        <Logo />
        <nav className="mt-8 flex-1 space-y-6 overflow-y-auto text-sm">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-ink-muted/70">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={adminHref(item.to)}
                    end={!item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between rounded-lg px-2.5 py-2 text-ink-muted transition hover:bg-bg-soft",
                        isActive && "bg-teal/10 font-medium text-teal-dark"
                      )
                    }
                  >
                    <span>{item.label}</span>
                    {item.to === "orders" && newOrders > 0 && (
                      <span className="rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">{newOrders}</span>
                    )}
                    {item.to === "messages" && unread > 0 && (
                      <span className="rounded-full bg-coral px-1.5 text-[10px] font-bold text-white">{unread}</span>
                    )}
                    {item.to === "articles" && drafts > 0 && (
                      <span className="rounded-full bg-sand px-1.5 text-[10px] font-bold text-ink">{drafts}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <button onClick={onLogout} className="mt-4 rounded-lg px-2.5 py-2 text-left text-sm text-coral-text hover:bg-coral-soft/50">
          লগ-আউট / Log out
        </button>
      </aside>
      <main className="flex-1 overflow-x-hidden p-5 sm:p-8">
        <div className="mb-5 flex justify-end gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}
