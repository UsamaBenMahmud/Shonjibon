import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteProduct, listProductsAdmin, listSimple, reorderProducts, saveProduct } from "@/lib/api";
import type { Product, ProductBenefit, ProductCategory, ProductImage, ProductSpec, ProcessStep } from "@/lib/types";
import { genId, slugify } from "@/lib/utils";
import { DataTable, MediaUploadField, type Column } from "@/admin/shared";
import { productAdminSchema } from "@/lib/schemas";
import { Badge, Button, FieldWrap, Input, Modal, Select, Textarea } from "@/components/ui";
import { useUIStore } from "@/store/ui";

const emptyProduct = (): Product => ({
  id: "",
  slug: "",
  name_en: "",
  name_bn: "",
  tagline_en: "",
  tagline_bn: "",
  overview_en: "",
  overview_bn: "",
  trust_line_en: "",
  trust_line_bn: "",
  price: 0,
  currency: "BDT",
  price_note_en: "",
  price_note_bn: "",
  stock_status: "in_stock",
  is_flagship: false,
  is_published: true,
  cover_image: "",
  sort_order: 0,
  sku: "",
  tags: [],
  sale_price: null,
  stock_quantity: 10,
  low_stock_threshold: 5,
  badges: [],
  is_featured: false,
  created_at: "",
  updated_at: "",
  images: [],
  specs: [],
  benefits: [],
  process_steps: [],
});

type Tab = "basics" | "pricing" | "images" | "specs" | "benefits" | "process" | "seo";

export default function ProductsManager() {
  const qc = useQueryClient();
  const productsQ = useQuery({ queryKey: ["products-admin"], queryFn: listProductsAdmin });
  const categoriesQ = useQuery({
    queryKey: ["product_categories"],
    queryFn: () => listSimple<ProductCategory>("product_categories", { includeUnpublished: true }),
  });
  const pushToast = useUIStore((s) => s.pushToast);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [tab, setTab] = useState<Tab>("basics");

  const items = productsQ.data ?? [];

  async function handleSave() {
    if (!editing) return;
    const toSave = { ...editing, slug: editing.slug || slugify(editing.name_en || editing.name_bn) };
    const validation = productAdminSchema.safeParse(toSave);
    if (!validation.success) {
      pushToast(validation.error.issues[0]?.message ?? "তথ্য যাচাই করুন / Please check the form", "error");
      return;
    }
    try {
      await saveProduct(toSave);
      await qc.invalidateQueries({ queryKey: ["products-admin"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["product"] });
      pushToast("সংরক্ষিত হয়েছে / Saved", "success");
      setEditing(null);
    } catch (error) {
      pushToast(error instanceof Error ? `সংরক্ষণ ব্যর্থ / Save failed: ${error.message}` : "সংরক্ষণ ব্যর্থ / Save failed", "error");
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteProduct(deleting.id);
      await qc.invalidateQueries({ queryKey: ["products-admin"] });
      await qc.invalidateQueries({ queryKey: ["products"] });
      await qc.invalidateQueries({ queryKey: ["product"] });
      pushToast("মুছে ফেলা হয়েছে / Deleted", "success");
      setDeleting(null);
    } catch (error) {
      pushToast(error instanceof Error ? `মুছতে ব্যর্থ / Delete failed: ${error.message}` : "মুছতে ব্যর্থ / Delete failed", "error");
    }
  }

  function set<K extends keyof Product>(key: K, value: Product[K]) {
    setEditing((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  const columns: Column<Product>[] = [
    { key: "name_bn", label: "নাম", render: (p) => `${p.name_bn} / ${p.name_en}` },
    { key: "price", label: "Price", render: (p) => p.sale_price != null ? `৳${p.sale_price} (was ৳${p.price})` : `৳${p.price}` },
    { key: "stock_status", label: "Stock" },
    {
      key: "is_published",
      label: "Status",
      render: (p) => (p.is_published ? <Badge tone="teal">Published</Badge> : <Badge tone="sand">Draft</Badge>),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">পণ্য / Products</h1>
        <Button
          onClick={() => {
            setEditing(emptyProduct());
            setTab("basics");
          }}
        >
          + নতুন পণ্য / New product
        </Button>
      </div>

      {productsQ.isLoading ? (
        <p className="text-ink-muted">Loading...</p>
      ) : (
        <DataTable
          items={items}
          columns={columns}
          onEdit={(p) => {
            setEditing(p);
            setTab("basics");
          }}
          onDelete={(p) => setDeleting(p)}
          onReorder={(ids) => reorderProducts(ids)
            .then(async () => {
              await qc.invalidateQueries({ queryKey: ["products-admin"] });
              await qc.invalidateQueries({ queryKey: ["products"] });
            })
            .catch(async (error: unknown) => {
              pushToast(error instanceof Error ? `পুনর্বিন্যাস ব্যর্থ / Reorder failed: ${error.message}` : "পুনর্বিন্যাস ব্যর্থ / Reorder failed", "error");
              await qc.invalidateQueries({ queryKey: ["products-admin"] });
              await qc.invalidateQueries({ queryKey: ["products"] });
            })}
        />
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.name_en || "নতুন পণ্য / New product"} wide>
        {editing && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2 border-b border-border pb-3">
              {(["basics", "pricing", "images", "specs", "benefits", "process", "seo"] as Tab[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${tab === key ? "bg-teal text-white" : "bg-bg-soft text-ink-muted"}`}
                >
                  {key}
                </button>
              ))}
            </div>

            {tab === "basics" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrap label="Name (EN)"><Input value={editing.name_en} onChange={(e) => set("name_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="Name (বাং)"><Input value={editing.name_bn} onChange={(e) => set("name_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Tagline (EN)"><Input value={editing.tagline_en} onChange={(e) => set("tagline_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="Tagline (বাং)"><Input value={editing.tagline_bn} onChange={(e) => set("tagline_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Overview (EN)"><Textarea rows={4} value={editing.overview_en} onChange={(e) => set("overview_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="Overview (বাং)"><Textarea rows={4} value={editing.overview_bn} onChange={(e) => set("overview_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Trust line (EN)"><Input value={editing.trust_line_en} onChange={(e) => set("trust_line_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="Trust line (বাং)"><Input value={editing.trust_line_bn} onChange={(e) => set("trust_line_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Slug"><Input value={editing.slug} onChange={(e) => set("slug", e.target.value)} placeholder="auto from name" /></FieldWrap>
                <FieldWrap label="Product category">
                  <Select value={editing.category_id ?? ""} onChange={(e) => set("category_id", e.target.value || null)}>
                    <option value="">No category</option>
                    {(categoriesQ.data ?? []).map((category) => (
                      <option key={category.id} value={category.id}>{category.name_en} / {category.name_bn}</option>
                    ))}
                  </Select>
                </FieldWrap>
                <MediaUploadField label="Cover image URL" value={editing.cover_image} onChange={(value) => set("cover_image", value)} />
                <FieldWrap label="Price note (EN)"><Input value={editing.price_note_en} onChange={(e) => set("price_note_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="Price note (বাং)"><Input value={editing.price_note_bn} onChange={(e) => set("price_note_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Stock status">
                  <Select value={editing.stock_status} onChange={(e) => set("stock_status", e.target.value as Product["stock_status"])}>
                    <option value="in_stock">In stock</option>
                    <option value="preorder">Pre-order</option>
                    <option value="out_of_stock">Out of stock</option>
                    <option value="coming_soon">Coming soon</option>
                  </Select>
                </FieldWrap>
                <div className="flex items-center gap-6 pt-6">
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input type="checkbox" checked={editing.is_flagship} onChange={(e) => set("is_flagship", e.target.checked)} className="accent-teal" />
                    Flagship
                  </label>
                  <label className="flex items-center gap-2 text-sm font-medium text-ink">
                    <input type="checkbox" checked={editing.is_published} onChange={(e) => set("is_published", e.target.checked)} className="accent-teal" />
                    Published
                  </label>
                </div>
              </div>
            )}

            {tab === "pricing" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <FieldWrap label="SKU"><Input value={editing.sku ?? ""} onChange={(e) => set("sku", e.target.value)} /></FieldWrap>
                <FieldWrap label="Price (৳)"><Input type="number" min="0" value={editing.price} onChange={(e) => set("price", Number(e.target.value))} /></FieldWrap>
                <FieldWrap label="Sale price (৳)"><Input type="number" min="0" value={editing.sale_price ?? ""} onChange={(e) => set("sale_price", e.target.value === "" ? null : Number(e.target.value))} /></FieldWrap>
                <FieldWrap label="Stock quantity"><Input type="number" min="0" value={editing.stock_quantity ?? 0} onChange={(e) => set("stock_quantity", Number(e.target.value))} /></FieldWrap>
                <FieldWrap label="Low-stock threshold"><Input type="number" min="0" value={editing.low_stock_threshold ?? 5} onChange={(e) => set("low_stock_threshold", Number(e.target.value))} /></FieldWrap>
                <FieldWrap label="Weight"><Input type="number" min="0" value={editing.weight ?? ""} onChange={(e) => set("weight", e.target.value === "" ? null : Number(e.target.value))} /></FieldWrap>
                <FieldWrap label="Delivery note (EN)"><Input value={editing.delivery_note_en ?? ""} onChange={(e) => set("delivery_note_en", e.target.value)} /></FieldWrap>
                <FieldWrap label="ডেলিভারি নোট (বাং)"><Input value={editing.delivery_note_bn ?? ""} onChange={(e) => set("delivery_note_bn", e.target.value)} /></FieldWrap>
                <FieldWrap label="Badges (comma-separated)"><Input value={(editing.badges ?? []).join(", ")} onChange={(e) => set("badges", e.target.value.split(",").map((badge) => badge.trim()).filter(Boolean))} /></FieldWrap>
                <label className="flex items-center gap-2 text-sm font-medium text-ink">
                  <input type="checkbox" checked={Boolean(editing.is_featured)} onChange={(e) => set("is_featured", e.target.checked)} />
                  Featured product
                </label>
              </div>
            )}

            {tab === "images" && <ListEditor
              items={editing.images}
              onChange={(images) => set("images", images as ProductImage[])}
              newItem={() => ({ id: genId(), product_id: editing.id, url: "", alt_en: "", alt_bn: "", sort_order: editing.images.length + 1 })}
              renderFields={(item, update) => (
                <>
                  <MediaUploadField label="Image URL" value={item.url} onChange={(url) => update({ ...item, url })} />
                  <FieldWrap label="Alt (EN)"><Input value={item.alt_en} onChange={(e) => update({ ...item, alt_en: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Alt (বাং)"><Input value={item.alt_bn} onChange={(e) => update({ ...item, alt_bn: e.target.value })} /></FieldWrap>
                </>
              )}
            />}

            {tab === "specs" && <ListEditor
              items={editing.specs}
              onChange={(specs) => set("specs", specs as ProductSpec[])}
              newItem={() => ({ id: genId(), product_id: editing.id, label_en: "", label_bn: "", value_en: "", value_bn: "", sort_order: editing.specs.length + 1 })}
              renderFields={(item, update) => (
                <>
                  <FieldWrap label="Label (EN)"><Input value={item.label_en} onChange={(e) => update({ ...item, label_en: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Label (বাং)"><Input value={item.label_bn} onChange={(e) => update({ ...item, label_bn: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Value (EN)"><Input value={item.value_en} onChange={(e) => update({ ...item, value_en: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Value (বাং)"><Input value={item.value_bn} onChange={(e) => update({ ...item, value_bn: e.target.value })} /></FieldWrap>
                </>
              )}
            />}

            {tab === "benefits" && <ListEditor
              items={editing.benefits}
              onChange={(benefits) => set("benefits", benefits as ProductBenefit[])}
              newItem={() => ({ id: genId(), product_id: editing.id, icon: "leaf", title_en: "", title_bn: "", body_en: "", body_bn: "", sort_order: editing.benefits.length + 1 })}
              renderFields={(item, update) => (
                <>
                  <FieldWrap label="Icon key"><Input value={item.icon} onChange={(e) => update({ ...item, icon: e.target.value })} placeholder="leaf, droplet, coins..." /></FieldWrap>
                  <FieldWrap label="Title (EN)"><Input value={item.title_en} onChange={(e) => update({ ...item, title_en: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Title (বাং)"><Input value={item.title_bn} onChange={(e) => update({ ...item, title_bn: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Body (EN)"><Textarea rows={2} value={item.body_en} onChange={(e) => update({ ...item, body_en: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Body (বাং)"><Textarea rows={2} value={item.body_bn} onChange={(e) => update({ ...item, body_bn: e.target.value })} /></FieldWrap>
                </>
              )}
            />}

            {tab === "process" && <ListEditor
              items={editing.process_steps}
              onChange={(steps) => set("process_steps", steps as ProcessStep[])}
              newItem={() => ({ id: genId(), product_id: editing.id, step_no: editing.process_steps.length + 1, title_en: "", title_bn: "", body_en: "", body_bn: "", icon: "flask", sort_order: editing.process_steps.length + 1 })}
              renderFields={(item, update) => (
                <>
                  <FieldWrap label="Step #"><Input type="number" value={item.step_no} onChange={(e) => update({ ...item, step_no: Number(e.target.value) })} /></FieldWrap>
                  <FieldWrap label="Title (EN)"><Input value={item.title_en} onChange={(e) => update({ ...item, title_en: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Title (বাং)"><Input value={item.title_bn} onChange={(e) => update({ ...item, title_bn: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Body (EN)"><Textarea rows={2} value={item.body_en} onChange={(e) => update({ ...item, body_en: e.target.value })} /></FieldWrap>
                  <FieldWrap label="Body (বাং)"><Textarea rows={2} value={item.body_bn} onChange={(e) => update({ ...item, body_bn: e.target.value })} /></FieldWrap>
                </>
              )}
            />}

            {tab === "seo" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <p className="text-sm text-ink-muted sm:col-span-2">SEO metadata reuses the name/tagline unless search engines need something more specific.</p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" onClick={() => setEditing(null)}>বাতিল / Cancel</Button>
              <Button onClick={handleSave}>সংরক্ষণ / Save (Ctrl+S)</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="নিশ্চিত করুন / Confirm delete">
        <p className="text-sm text-ink-muted">{deleting?.name_en} — আপনি কি নিশ্চিত? / Are you sure?</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleting(null)}>বাতিল / Cancel</Button>
          <Button className="bg-coral text-coral-ink hover:bg-coral/90" onClick={handleDelete}>মুছুন / Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

function ListEditor<T extends { id: string; sort_order: number }>({
  items,
  onChange,
  newItem,
  renderFields,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  newItem: () => T;
  renderFields: (item: T, update: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      {items.map((item, idx) => (
        <div key={item.id} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          {renderFields(item, (next) => {
            const copy = [...items];
            copy[idx] = next;
            onChange(copy);
          })}
          <div className="sm:col-span-2">
            <div className="mb-2 flex gap-3">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => onChange(items.map((entry, order) => {
                  const target = order === idx ? idx - 1 : order === idx - 1 ? idx : order;
                  const value = target === idx ? items[idx - 1] : target === idx - 1 ? items[idx] : entry;
                  return { ...value, sort_order: order + 1 };
                }))}
                className="text-xs text-teal-dark disabled:opacity-40"
              >
                ↑ Move up
              </button>
              <button
                type="button"
                disabled={idx === items.length - 1}
                onClick={() => onChange(items.map((entry, order) => {
                  const value = order === idx ? items[idx + 1] : order === idx + 1 ? items[idx] : entry;
                  return { ...value, sort_order: order + 1 };
                }))}
                className="text-xs text-teal-dark disabled:opacity-40"
              >
                ↓ Move down
              </button>
            </div>
            <button
              type="button"
              onClick={() => onChange(items.filter((i) => i.id !== item.id))}
              className="text-xs font-medium text-coral-text hover:underline"
            >
              মুছুন / Remove
            </button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" onClick={() => onChange([...items, newItem()])}>
        + যোগ করুন / Add row
      </Button>
    </div>
  );
}
