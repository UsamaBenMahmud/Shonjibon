import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listArticlesAdmin, listAuditLog, listMessagesAdmin, listOrdersAdmin } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { EmptyState } from "@/components/ui";

export default function Dashboard() {
  const ordersQ = useQuery({ queryKey: ["orders-admin"], queryFn: listOrdersAdmin });
  const messagesQ = useQuery({ queryKey: ["messages"], queryFn: listMessagesAdmin });
  const articlesQ = useQuery({ queryKey: ["articles-admin"], queryFn: listArticlesAdmin });
  const auditQ = useQuery({ queryKey: ["audit_log"], queryFn: listAuditLog });

  const newOrders = (ordersQ.data ?? []).filter((o) => o.status === "new").length;
  const unread = (messagesQ.data ?? []).filter((m) => !m.is_read).length;
  const drafts = (articlesQ.data ?? []).filter((a) => a.status === "draft").length;

  const cards = [
    { label: "নতুন অর্ডার / New orders", value: newOrders, to: "/admin/orders" },
    { label: "অপঠিত বার্তা / Unread messages", value: unread, to: "/admin/messages" },
    { label: "ড্রাফট নিবন্ধ / Draft articles", value: drafts, to: "/admin/articles" },
  ];

  const quickAdd = [
    { label: "+ পণ্য / Product", to: "/admin/products" },
    { label: "+ নিবন্ধ / Article", to: "/admin/articles" },
    { label: "+ টিম সদস্য / Team member", to: "/admin/team" },
    { label: "+ পরীক্ষা ফলাফল / Test result", to: "/admin/testing" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-semibold text-ink">ড্যাশবোর্ড / Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <Link key={c.label} to={c.to} className="card p-5 transition hover:shadow-md">
            <p className="font-display text-3xl font-semibold text-teal-dark">{c.value}</p>
            <p className="mt-1 text-sm text-ink-muted">{c.label}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">দ্রুত যোগ করুন / Quick add</h2>
        <div className="flex flex-wrap gap-2">
          {quickAdd.map((q) => (
            <Link key={q.label} to={q.to} className="btn-secondary text-sm">
              {q.label}
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">সাম্প্রতিক কার্যকলাপ / Recent activity</h2>
        {(auditQ.data ?? []).length === 0 ? (
          <EmptyState title="কোনো কার্যকলাপ নেই / No activity yet" />
        ) : (
          <div className="card divide-y divide-border p-0">
            {(auditQ.data ?? []).slice(0, 8).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-ink">
                  {entry.action} · <span className="text-ink-muted">{entry.table_name}</span>
                </span>
                <span className="text-xs text-ink-muted">{formatDate(entry.created_at, "en")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
