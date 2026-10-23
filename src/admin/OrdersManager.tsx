import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteOrder, listOrdersAdmin, updateOrderPaymentStatus, updateOrderStatus } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge, Button, EmptyState, Modal, Select } from "@/components/ui";
import { useUIStore } from "@/store/ui";

const statusTone: Record<OrderStatus, "neutral" | "teal" | "coral" | "sand"> = {
  new: "coral",
  confirmed: "teal",
  packed: "sand",
  delivered: "teal",
  cancelled: "neutral",
};

export default function OrdersManager() {
  const qc = useQueryClient();
  const ordersQ = useQuery({ queryKey: ["orders-admin"], queryFn: listOrdersAdmin });
  const pushToast = useUIStore((s) => s.pushToast);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [viewing, setViewing] = useState<Order | null>(null);

  const orders = ordersQ.data ?? [];
  const filtered = useMemo(() => (filter === "all" ? orders : orders.filter((o) => o.status === filter)), [orders, filter]);

  async function setStatus(order: Order, status: OrderStatus) {
    try {
      await updateOrderStatus(order.id, status);
      await qc.invalidateQueries({ queryKey: ["orders-admin"] });
      pushToast("আপডেট হয়েছে / Updated", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `আপডেট ব্যর্থ / Update failed: ${error.message}` : "আপডেট ব্যর্থ / Update failed", "error");
    }
  }

  async function removeOrder(order: Order) {
    if (!window.confirm(`${order.order_no} মুছবেন? / Delete this order?`)) return;
    try {
      await deleteOrder(order.id);
      await qc.invalidateQueries({ queryKey: ["orders-admin"] });
      pushToast("মুছে ফেলা হয়েছে / Deleted", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `মুছতে ব্যর্থ / Delete failed: ${error.message}` : "মুছতে ব্যর্থ / Delete failed", "error");
    }
  }

  async function setPaymentStatus(order: Order, payment_status: NonNullable<Order["payment_status"]>) {
    try {
      await updateOrderPaymentStatus(order.id, payment_status);
      await qc.invalidateQueries({ queryKey: ["orders-admin"] });
      pushToast("পেমেন্ট আপডেট হয়েছে / Payment status updated", "success");
    } catch (error) {
      pushToast(error instanceof Error ? `পেমেন্ট আপডেট ব্যর্থ / Payment update failed: ${error.message}` : "পেমেন্ট আপডেট ব্যর্থ / Payment update failed", "error");
    }
  }

  function exportCsv() {
    const header = "Order No,Customer,Phone,District,Total,Status,Date\n";
    const rows = filtered
      .map((o) => [o.order_no, o.customer_name, o.phone, o.district, o.total, o.status, o.created_at].join(","))
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shonjibon-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-ink">অর্ডার / Orders</h1>
        <div className="flex gap-2">
          <Select value={filter} onChange={(e) => setFilter(e.target.value as OrderStatus | "all")} className="w-auto">
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="confirmed">Confirmed</option>
            <option value="packed">Packed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Button variant="secondary" onClick={exportCsv}>Export CSV</Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="কোনো অর্ডার নেই / No orders yet" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg-soft text-left text-ink-muted">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b border-border last:border-0 hover:bg-bg-soft/50">
                  <td className="px-4 py-3 font-medium text-ink">{o.order_no}</td>
                  <td className="px-4 py-3 text-ink-muted">{o.customer_name} · {o.phone}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatCurrency(o.total, "BDT", "en")}</td>
                  <td className="px-4 py-3">
                    <Badge tone={statusTone[o.status]}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(o.created_at, "en")}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setViewing(o)} className="text-xs font-medium text-teal-dark hover:underline">View</button>
                      <Select
                        value={o.status}
                        onChange={(e) => setStatus(o, e.target.value as OrderStatus)}
                        className="w-auto px-2 py-1 text-xs"
                      >
                        <option value="new">New</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </Select>
                      <Select
                        aria-label={`Payment status for ${o.order_no}`}
                        value={o.payment_status ?? "unpaid"}
                        onChange={(e) => setPaymentStatus(o, e.target.value as NonNullable<Order["payment_status"]>)}
                        className="w-auto px-2 py-1 text-xs"
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </Select>
                      <button onClick={() => removeOrder(o)} className="text-xs font-medium text-coral-text hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.order_no} wide>
        {viewing && (
          <div className="space-y-4 print:text-black" id="invoice">
            <div className="grid gap-2 text-sm text-ink">
              <p><strong>Customer:</strong> {viewing.customer_name}</p>
              <p><strong>Phone:</strong> {viewing.phone}</p>
              <p><strong>Email:</strong> {viewing.email || "—"}</p>
              <p><strong>Address:</strong> {viewing.address}, {viewing.district}</p>
              <p><strong>Note:</strong> {viewing.note || "—"}</p>
              <p><strong>Payment:</strong> {viewing.payment_method ?? "cash_on_delivery"} · {viewing.payment_status ?? "unpaid"}</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-ink-muted">
                  <th className="py-2">Item</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2">Unit</th>
                  <th className="py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {viewing.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="py-2">{item.product_name_bn} / {item.product_name_en}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">{formatCurrency(item.unit_price, "BDT", "en")}</td>
                    <td className="py-2">{formatCurrency(item.unit_price * item.quantity, "BDT", "en")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-right font-semibold text-ink">Total: {formatCurrency(viewing.total, "BDT", "en")}</p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => window.print()}>Print invoice</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
