import { hasSupabase, MEDIA_BUCKET, supabase } from "@/lib/supabase";
import { getDb, setDb, resetDb, recordAudit, makeOrderNo, genId, now, type DB } from "@/lib/mockDb";
import { backupSchema, mediaUploadSchema } from "@/lib/schemas";
import { getMockAccount } from "@/lib/mockAccount";
import type {
  Article,
  ArticleCategory,
  AuditLogEntry,
  CommunityVisit,
  ContactMessage,
  Download,
  Faq,
  ImpactStat,
  JourneyMilestone,
  MediaItem,
  Order,
  NavItem,
  PageSection,
  Partner,
  Profile,
  Product,
  ResearchItem,
  Settings,
  ShellPart,
  Subscriber,
  TeamMember,
  Testimonial,
  TestResult,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// api.ts — one typed interface, two implementations (Supabase | mockDb).
// Every public read filters to published/visible rows. Admin reads/writes use
// the *Admin variants which return everything (draft content included).
// ---------------------------------------------------------------------------

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function canShowImpactStat(stat: ImpactStat): boolean {
  if (stat.is_sample) return stat.status !== "verified";
  const status = stat.status ?? (stat.source_name && stat.source_url ? "verified" : undefined);
  if (status === "sample" || status === "target") return true;
  return status === "verified" && Boolean(stat.source_name && stat.source_url);
}

async function functionError(error: unknown): Promise<Error> {
  if (error && typeof error === "object" && "context" in error) {
    const context = (error as { context?: unknown }).context;
    if (context instanceof Response) {
      const payload = await context.clone().json().catch(() => null) as { error?: unknown } | null;
      if (typeof payload?.error === "string") return new Error(payload.error);
    }
  }
  return error instanceof Error ? error : new Error("সার্ভারে সমস্যা হয়েছে / Server request failed");
}

const localRateBuckets = new Map<string, number[]>();

function enforceLocalRateLimit(action: "orders" | "contact" | "subscribers") {
  const key = `shonjibon.rate.${action}`;
  const cutoff = Date.now() - 60 * 60 * 1000;
  let timestamps = localRateBuckets.get(action) ?? [];
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    timestamps = Array.isArray(stored)
      ? stored.filter((timestamp): timestamp is number => typeof timestamp === "number")
      : [];
  } catch {
    // Keep the in-memory bucket when browser storage is unavailable.
  }
  timestamps = timestamps.filter((timestamp) => Number.isFinite(timestamp) && timestamp > cutoff);
  if (timestamps.length >= 5) {
    throw new Error("অনেকবার চেষ্টা করা হয়েছে / Too many submissions; try again later");
  }
  timestamps.push(Date.now());
  localRateBuckets.set(action, timestamps);
  try {
    localStorage.setItem(key, JSON.stringify(timestamps));
  } catch {
    // The per-tab in-memory limit remains active if localStorage is unavailable.
  }
}

async function mutateDb<T>(fn: (db: DB) => T): Promise<T> {
  const db = getDb();
  const result = fn(db);
  setDb(db);
  return result;
}

// ---- Products ---------------------------------------------------------

export async function listProducts(): Promise<Product[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), specs:product_specs(*), benefits:product_benefits(*), process_steps(*)")
      .eq("is_published", true)
      .order("sort_order");
    if (error) throw error;
    return data as unknown as Product[];
  }
  const db = getDb();
  return clone(db.products.filter((p) => p.is_published).sort((a, b) => a.sort_order - b.sort_order));
}

export async function listProductsAdmin(): Promise<Product[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), specs:product_specs(*), benefits:product_benefits(*), process_steps(*)")
      .order("sort_order");
    if (error) throw error;
    return data as unknown as Product[];
  }
  const db = getDb();
  return clone(db.products.sort((a, b) => a.sort_order - b.sort_order));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), specs:product_specs(*), benefits:product_benefits(*), process_steps(*)")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (error) throw error;
    return data as unknown as Product | null;
  }
  const db = getDb();
  const found = db.products.find((p) => p.slug === slug && p.is_published);
  return found ? clone(found) : null;
}

export async function saveProduct(product: Product): Promise<Product> {
  if (hasSupabase && supabase) {
    const { images, specs, benefits, process_steps, ...productRow } = product;
    if (!productRow.id) delete (productRow as Partial<Product>).id;
    if (!productRow.created_at) delete (productRow as Partial<Product>).created_at;
    if (!productRow.updated_at) delete (productRow as Partial<Product>).updated_at;
    const { data, error } = await supabase.from("products").upsert(productRow).select().single();
    if (error) throw error;
    const productId = data.id as string;
    const childRows = [
      ["product_images", images],
      ["product_specs", specs],
      ["product_benefits", benefits],
      ["process_steps", process_steps],
    ] as const;
    for (const [table, rows] of childRows) {
      const current = await supabase.from(table).select("id").eq("product_id", productId);
      if (current.error) throw current.error;
      const nextIds = new Set(rows.map((row) => row.id));
      const removed = (current.data ?? []).filter((row) => !nextIds.has(row.id)).map((row) => row.id);
      if (rows.length) {
        const { error: saveError } = await supabase.from(table).upsert(
          rows.map((row) => ({ ...row, product_id: productId }))
        );
        if (saveError) throw saveError;
      }
      for (const id of removed) {
        const { error: deleteError } = await supabase.from(table).delete().eq("id", id);
        if (deleteError) throw deleteError;
      }
    }
    const { data: saved, error: readError } = await supabase
      .from("products")
      .select("*, images:product_images(*), specs:product_specs(*), benefits:product_benefits(*), process_steps(*)")
      .eq("id", productId)
      .single();
    if (readError) throw readError;
    return saved as unknown as Product;
  }
  return mutateDb((db) => {
    const before = db.products.find((p) => p.id === product.id);
    const idx = db.products.findIndex((p) => p.id === product.id);
    const id = product.id || genId();
    const stockQuantity = product.stock_quantity ?? (product.stock_status === "out_of_stock" ? 0 : 10);
    const next = {
      ...product,
      id,
      stock_quantity: stockQuantity,
      stock_status: product.stock_status === "preorder" || product.stock_status === "coming_soon"
        ? product.stock_status
        : stockQuantity === 0 ? "out_of_stock" as const : "in_stock" as const,
      images: product.images.map((image) => ({ ...image, product_id: id })),
      specs: product.specs.map((spec) => ({ ...spec, product_id: id })),
      benefits: product.benefits.map((benefit) => ({ ...benefit, product_id: id })),
      process_steps: product.process_steps.map((step) => ({ ...step, product_id: id })),
      updated_at: now(),
    };
    if (idx >= 0) db.products[idx] = next;
    else db.products.push({ ...next, created_at: now() });
    recordAudit(db, before ? "update" : "create", "products", next.id, before ?? null, next);
    return next;
  });
}

export async function deleteProduct(id: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const before = db.products.find((p) => p.id === id);
    db.products = db.products.filter((p) => p.id !== id);
    recordAudit(db, "delete", "products", id, before ?? null, null);
  });
}

export async function reorderProducts(orderedIds: string[]): Promise<void> {
  if (hasSupabase && supabase) {
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await supabase.from("products").update({ sort_order: index + 1 }).eq("id", id);
      if (error) throw error;
    }
    return;
  }
  await mutateDb((db) => {
    const before = db.products.map((product) => product.id);
    orderedIds.forEach((id, index) => {
      const p = db.products.find((item) => item.id === id);
      if (p) p.sort_order = index + 1;
    });
    recordAudit(db, "reorder", "products", "all", before, orderedIds);
  });
}

// ---- Generic collection helpers for simple admin-managed tables --------

export type SimpleTable =
  | "article_categories"
  | "product_categories"
  | "journey_milestones"
  | "research_items"
  | "test_results"
  | "impact_stats"
  | "team_members"
  | "testimonials"
  | "faqs"
  | "partners"
  | "downloads"
  | "community_visits"
  | "page_sections"
  | "nav_items"
  | "shell_parts";

export async function listSimple<T extends { id: string; sort_order?: number }>(
  table: SimpleTable,
  options: { includeSamples?: boolean; includeUnpublished?: boolean; pageKey?: PageSection["page_key"] } = {}
): Promise<T[]> {
  if (hasSupabase && supabase) {
    const select = table === "community_visits" ? "*, photos:community_photos(*)" : "*";
    let query = supabase.from(table).select(select);
    if (table === "team_members") query = query.eq("group_type", "team");
    if (table === "page_sections" || table === "nav_items" || table === "shell_parts") {
      if (!options.includeUnpublished) query = query.eq("is_visible", true);
      if (table === "page_sections" && !options.includeUnpublished) query = query.eq("is_sample", false);
      if (options.pageKey) query = query.eq("page_key", options.pageKey);
    } else if (!options.includeUnpublished) {
      query = query.eq("is_published", true);
    }
    const { data, error } = await query.order("sort_order", { ascending: true });
    if (error) throw error;
    const rows = (data ?? []) as unknown as T[];
    if (!options.includeSamples && table === "test_results") {
      return rows.filter((row) => {
        const result = row as { status?: string; is_sample?: boolean };
        return result.status !== "sample" && !result.is_sample;
      }) as T[];
    }
    if (!options.includeSamples && table === "impact_stats") return rows.filter((row) => canShowImpactStat(row as unknown as ImpactStat)) as T[];
    if (!options.includeSamples && table === "testimonials") return rows.filter((row) => !(row as { is_sample?: boolean }).is_sample) as T[];
    if (!options.includeSamples && table === "page_sections") {
      return rows.filter((row) => {
        const section = row as T & PageSection;
        return !section.is_sample && (section.type !== "stats" || (!!section.source_name && !!section.source_url));
      }) as T[];
    }
    if (!options.includeUnpublished && table === "nav_items") {
      return rows.filter((row) => (row as T & NavItem).is_visible) as T[];
    }
    if (table === "community_visits") {
      return rows.map((row) => {
        const visit = row as T & { photos?: { sort_order: number }[] };
        return { ...visit, photos: [...(visit.photos ?? [])].sort((a, b) => a.sort_order - b.sort_order) };
      }) as T[];
    }
    return rows;
  }
  const db = getDb();
  const items = ((db[table] as unknown as T[]) ?? []).filter((row) =>
    table !== "team_members" || (row as T & { group_type?: string }).group_type === "team"
  );
  const visible = options.includeSamples
    ? items
    : items.filter((row) => {
        if (table === "test_results") {
          const result = row as { status?: string; is_sample?: boolean };
          return result.status !== "sample" && !result.is_sample;
        }
        if (table === "impact_stats") return canShowImpactStat(row as unknown as ImpactStat);
        if (table === "testimonials") return !(row as { is_sample?: boolean }).is_sample;
        return true;
      });
  const published = options.includeUnpublished
    ? visible
    : visible.filter((row) => {
        if (table === "page_sections" || table === "nav_items" || table === "shell_parts") {
          const visibleRow = row as T & Partial<PageSection> & Partial<NavItem> & Partial<ShellPart>;
          return visibleRow.is_visible !== false
            && (table !== "page_sections" || visibleRow.is_sample !== true)
            && (table !== "page_sections" || visibleRow.type !== "stats" || (!!visibleRow.source_name && !!visibleRow.source_url));
        }
        return (row as { is_published?: boolean }).is_published !== false;
      });
  const pageFiltered = table === "page_sections"
    ? published.filter((row) => !options.pageKey || (row as T & PageSection).page_key === options.pageKey)
    : published;
  return clone(pageFiltered)
    .map((row) => {
      if (table !== "community_visits") return row;
      const visit = row as T & { photos?: { sort_order: number }[] };
      return { ...visit, photos: [...(visit.photos ?? [])].sort((a, b) => a.sort_order - b.sort_order) };
    })
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export async function saveSimple<T extends { id: string }>(table: SimpleTable, item: T): Promise<T> {
  if (hasSupabase && supabase) {
    if (table === "test_results") {
      const result = item as T & { status: string; is_sample?: boolean };
      if (result.status === "sample") result.is_sample = true;
    }
    if (table === "community_visits") {
      const visit = item as T & { photos?: { id: string; visit_id?: string }[] };
      const { photos = [], ...visitRow } = visit;
      const { data: savedVisit, error: visitError } = await supabase
        .from("community_visits")
        .upsert(visitRow as Partial<CommunityVisit>)
        .select()
        .single();
      if (visitError) throw visitError;
      const visitId = savedVisit.id as string;
      const current = await supabase.from("community_photos").select("id").eq("visit_id", visitId);
      if (current.error) throw current.error;
      const nextIds = new Set(photos.map((photo) => photo.id));
      const removed = (current.data ?? []).filter((photo) => !nextIds.has(photo.id)).map((photo) => photo.id);
      if (photos.length) {
        const { error } = await supabase.from("community_photos").upsert(
          photos.map((photo) => ({ ...photo, visit_id: visitId }))
        );
        if (error) throw error;
      }
      for (const id of removed) {
        const { error } = await supabase.from("community_photos").delete().eq("id", id);
        if (error) throw error;
      }
      return { ...savedVisit, photos } as unknown as T;
    }
    const { data, error } = await supabase.from(table).upsert(item).select().single();
    if (error) throw error;
    return data as unknown as T;
  }
  return mutateDb((db) => {
    const list = db[table] as unknown as T[];
    const before = list.find((i) => i.id === item.id);
    const idx = list.findIndex((i) => i.id === item.id);
    const id = item.id || genId();
    if (table === "test_results") {
      const result = item as T & { status: string; is_sample?: boolean };
      const previous = before as (T & { is_sample?: boolean }) | undefined;
      if (previous?.is_sample && result.is_sample === false) {
        throw new Error("Sample test results cannot be reclassified as real / নমুনা ফলাফলকে আসল ফলাফল হিসেবে পরিবর্তন করা যাবে না");
      }
      if (result.status === "sample") result.is_sample = true;
      if (result.is_sample && result.status === "verified") {
        throw new Error("Sample test results cannot be verified / নমুনা পরীক্ষার ফলাফল যাচাই করা যাবে না");
      }
    }
    const next = table === "community_visits"
      ? {
          ...item,
          id,
          photos: ((item as T & { photos?: { id: string }[] }).photos ?? []).map((photo) => ({
            ...photo,
            visit_id: id,
          })),
        } as T
      : { ...item, id };
    if (idx >= 0) list[idx] = next;
    else list.push(next);
    recordAudit(db, before ? "update" : "create", table, next.id, before ?? null, next);
    return next;
  });
}

export async function deleteSimple(table: SimpleTable, id: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const list = db[table] as unknown as { id: string }[];
    const before = list.find((i) => i.id === id);
    (db[table] as unknown as { id: string }[]) = list.filter((i) => i.id !== id);
    recordAudit(db, "delete", table, id, before ?? null, null);
  });
}

export async function reorderSimple(table: SimpleTable, orderedIds: string[]): Promise<void> {
  if (hasSupabase && supabase) {
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await supabase.from(table).update({ sort_order: index + 1 }).eq("id", id);
      if (error) throw error;
    }
    return;
  }
  await mutateDb((db) => {
    const before = (db[table] as unknown as { id: string; sort_order: number }[])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((item) => item.id);
    const list = db[table] as unknown as { id: string; sort_order: number }[];
    orderedIds.forEach((id, index) => {
      const item = list.find((i) => i.id === id);
      if (item) item.sort_order = index + 1;
    });
    recordAudit(db, "reorder", table, "all", before, orderedIds);
  });
}

// ---- Articles -----------------------------------------------------------

export async function listArticles(opts?: { categorySlug?: string }): Promise<Article[]> {
  if (hasSupabase && supabase) {
    let query = supabase.from("articles").select("*").eq("status", "published").order("sort_order", { ascending: true }).order("published_at", { ascending: false });
    if (opts?.categorySlug) {
      const { data: category, error: categoryError } = await supabase
        .from("article_categories")
        .select("id")
        .eq("slug", opts.categorySlug)
        .maybeSingle();
      if (categoryError) throw categoryError;
      if (!category) return [];
      query = query.eq("category_id", category.id);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as Article[];
  }
  const db = getDb();
  let items = db.articles.filter((a) => a.status === "published");
  if (opts?.categorySlug) {
    const cat = db.article_categories.find((c) => c.slug === opts.categorySlug);
    items = items.filter((a) => a.category_id === cat?.id);
  }
  items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  return clone(items);
}

export async function listArticlesAdmin(): Promise<Article[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("articles").select("*").order("sort_order", { ascending: true }).order("updated_at", { ascending: false });
    if (error) throw error;
    return data as unknown as Article[];
  }
  const db = getDb();
  return clone([...db.articles].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || b.updated_at.localeCompare(a.updated_at)));
}

export async function reorderArticles(orderedIds: string[]): Promise<void> {
  if (hasSupabase && supabase) {
    for (const [index, id] of orderedIds.entries()) {
      const { error } = await supabase.from("articles").update({ sort_order: index + 1 }).eq("id", id);
      if (error) throw error;
    }
    return;
  }
  await mutateDb((db) => {
    const before = db.articles
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((article) => article.id);
    orderedIds.forEach((id, index) => {
      const article = db.articles.find((entry) => entry.id === id);
      if (article) article.sort_order = index + 1;
    });
    recordAudit(db, "reorder", "articles", "all", before, orderedIds);
  });
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("articles").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
    if (error) throw error;
    return data as unknown as Article | null;
  }
  const db = getDb();
  const found = db.articles.find((a) => a.slug === slug && a.status === "published");
  return found ? clone(found) : null;
}

export async function saveArticle(article: Article): Promise<Article> {
  if (hasSupabase && supabase) {
    const articleRow = { ...article };
    if (!articleRow.id) delete (articleRow as Partial<Article>).id;
    if (!articleRow.created_at) delete (articleRow as Partial<Article>).created_at;
    if (!articleRow.updated_at) delete (articleRow as Partial<Article>).updated_at;
    const { data, error } = await supabase.from("articles").upsert(articleRow).select().single();
    if (error) throw error;
    return data as unknown as Article;
  }
  return mutateDb((db) => {
    const before = db.articles.find((a) => a.id === article.id);
    const idx = db.articles.findIndex((a) => a.id === article.id);
    const next = { ...article, id: article.id || genId(), updated_at: now() };
    if (idx >= 0) db.articles[idx] = next;
    else db.articles.push({ ...next, created_at: now() });
    recordAudit(db, before ? "update" : "create", "articles", next.id, before ?? null, next);
    return next;
  });
}

export async function deleteArticle(id: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("articles").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const before = db.articles.find((a) => a.id === id);
    db.articles = db.articles.filter((a) => a.id !== id);
    recordAudit(db, "delete", "articles", id, before ?? null, null);
  });
}

// ---- Settings -------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("site_settings").select("*");
    if (error) throw error;
    const map: Record<string, unknown> = {};
    for (const row of data as { key: string; value: unknown }[]) {
      if (row.key !== "admin_password") map[row.key] = row.value;
    }
    const contact = map.contact as Settings["contact"] | undefined;
    if (contact) {
      map.contact_phone = contact.phone || map.contact_phone || "";
      map.contact_email = contact.email || map.contact_email || "";
      map.contact_address_en = contact.address || map.contact_address_en || "";
    }
    return map as unknown as Settings;
  }
  const db = getDb();
  return clone(db.settings);
}

export async function saveSettings(settings: Settings): Promise<Settings> {
  const contact = {
    phone: settings.contact_phone,
    email: settings.contact_email,
    address: settings.contact_address_en,
    hours: settings.contact?.hours ?? "",
    map_link: settings.contact?.map_link ?? "",
    whatsapp_enabled: settings.contact?.whatsapp_enabled ?? false,
  };
  const normalized = { ...settings, contact };
  if (hasSupabase && supabase) {
    const entries = Object.entries(normalized).filter(([key]) => key !== "admin_password");
    for (const [key, value] of entries) {
      const { error } = await supabase.from("site_settings").upsert({ key, value });
      if (error) throw error;
    }
    return normalized;
  }
  return mutateDb((db) => {
    const before = db.settings;
    db.settings = normalized;
    recordAudit(db, "update", "site_settings", "settings", before, normalized);
    return normalized;
  });
}

// ---- Orders -----------------------------------------------------------

export interface NewOrderInput {
  customer_name: string;
  phone: string;
  email?: string;
  address: string;
  district: string;
  note?: string;
  payment_method?: "cash_on_delivery" | "bank_transfer" | "mobile_money" | "sslcommerz";
  items: { product_id: string; quantity: number }[];
}

export interface CreatedOrder {
  orderNo: string;
  paymentUrl?: string;
}

export async function createOrder(input: NewOrderInput): Promise<CreatedOrder> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: {
        customer: {
          customer_name: input.customer_name,
          phone: input.phone,
          email: input.email ?? "",
          address: input.address,
          district: input.district,
          note: input.note ?? "",
          payment_method: input.payment_method ?? "cash_on_delivery",
        },
        items: input.items.map(({ product_id, quantity }) => ({ product_id, quantity })),
      },
    });
    if (error) throw await functionError(error);
    if (typeof data?.order_no !== "string") throw new Error("Order service returned an invalid response");
    return {
      orderNo: data.order_no,
      ...(typeof data.payment_url === "string" ? { paymentUrl: data.payment_url } : {}),
    };
  }
  enforceLocalRateLimit("orders");
  return mutateDb((db) => {
    const seenProductIds = new Set<string>();
    const items = input.items.map((item) => {
      const product = db.products.find((entry) => entry.id === item.product_id);
      if (
        !product ||
        !product.is_published ||
        !["in_stock", "preorder"].includes(product.stock_status) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 9999 ||
        seenProductIds.has(item.product_id)
      ) {
        throw new Error("Product is unavailable or order quantity is invalid");
      }
      seenProductIds.add(item.product_id);
      if (product.stock_status !== "preorder" && product.stock_quantity != null && product.stock_quantity < item.quantity) {
        throw new Error("Insufficient stock for this order");
      }
      return {
        product_id: product.id,
        product_name_en: product.name_en,
        product_name_bn: product.name_bn,
        unit_price: product.sale_price ?? product.price,
        quantity: item.quantity,
      };
    });
    const total = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const id = genId();
    const order: Order = {
      id,
      order_no: makeOrderNo(db),
      user_id: getMockAccount()?.id ?? null,
      customer_name: input.customer_name,
      phone: input.phone,
      email: input.email ?? "",
      address: input.address,
      district: input.district,
      note: input.note ?? "",
      payment_method: input.payment_method ?? "cash_on_delivery",
      payment_status: input.payment_method && input.payment_method !== "cash_on_delivery" ? "pending" : "unpaid",
      status: "new",
      total,
      created_at: now(),
      updated_at: now(),
      items: items.map((item) => ({ ...item, id: genId(), order_id: id })),
    };
    db.orders.unshift(order);
    for (const item of items) {
      const product = db.products.find((entry) => entry.id === item.product_id);
      if (product && product.stock_status !== "preorder" && product.stock_quantity != null) {
        product.stock_quantity -= item.quantity;
        if (product.stock_quantity === 0) product.stock_status = "out_of_stock";
      }
    }
    recordAudit(db, "create", "orders", id, null, order);
    return { orderNo: order.order_no };
  });
}

export async function listOrdersAdmin(): Promise<Order[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("orders").select("*, items:order_items(*)").order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as Order[];
  }
  const db = getDb();
  return clone([...db.orders].sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function updateOrderStatus(id: string, status: Order["status"], note?: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("orders").update({ status, note }).eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const order = db.orders.find((o) => o.id === id);
    if (!order) return;
    const before = { ...order };
    order.status = status;
    if (note !== undefined) order.note = note;
    order.updated_at = now();
    recordAudit(db, "update", "orders", id, before, order);
  });
}

export async function updateOrderPaymentStatus(
  id: string,
  payment_status: NonNullable<Order["payment_status"]>,
): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("orders").update({ payment_status }).eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const order = db.orders.find((entry) => entry.id === id);
    if (!order) throw new Error("Order not found");
    const before = { ...order };
    order.payment_status = payment_status;
    order.updated_at = now();
    recordAudit(db, "update", "orders", id, before, order);
  });
}

export async function deleteOrder(id: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const before = db.orders.find((order) => order.id === id);
    db.orders = db.orders.filter((order) => order.id !== id);
    recordAudit(db, "delete", "orders", id, before ?? null, null);
  });
}

// ---- Contact messages / subscribers --------------------------------------

export async function submitContactMessage(input: Omit<ContactMessage, "id" | "is_read" | "created_at" | "updated_at">): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.functions.invoke("send-contact-email", { body: input });
    if (error) throw await functionError(error);
    return;
  }
  enforceLocalRateLimit("contact");
  await mutateDb((db) => {
    db.contact_messages.unshift({ ...input, id: genId(), is_read: false, created_at: now(), updated_at: now() });
  });
}

export async function listMessagesAdmin(): Promise<ContactMessage[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as ContactMessage[];
  }
  const db = getDb();
  return clone([...db.contact_messages].sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function markMessageRead(id: string, is_read: boolean): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("contact_messages").update({ is_read }).eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const msg = db.contact_messages.find((m) => m.id === id);
    if (msg) {
      const before = { ...msg };
      msg.is_read = is_read;
      recordAudit(db, "update", "contact_messages", id, before, msg);
    }
  });
}

export async function deleteMessage(id: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const before = db.contact_messages.find((message) => message.id === id);
    db.contact_messages = db.contact_messages.filter((message) => message.id !== id);
    recordAudit(db, "delete", "contact_messages", id, before ?? null, null);
  });
}

export async function subscribeNewsletter(email: string, company = ""): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.functions.invoke("subscribe-newsletter", { body: { email, company } });
    if (error) throw await functionError(error);
    return;
  }
  if (company) return;
  enforceLocalRateLimit("subscribers");
  await mutateDb((db) => {
    if (db.subscribers.some((s) => s.email === email)) return;
    db.subscribers.unshift({ id: genId(), email, created_at: now() });
  });
}

export async function listSubscribersAdmin(): Promise<Subscriber[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as Subscriber[];
  }
  const db = getDb();
  return clone([...db.subscribers].sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function deleteSubscriber(id: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("subscribers").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const before = db.subscribers.find((subscriber) => subscriber.id === id);
    db.subscribers = db.subscribers.filter((subscriber) => subscriber.id !== id);
    recordAudit(db, "delete", "subscribers", id, before ?? null, null);
  });
}

export async function listAdminUsers(): Promise<Profile[]> {
  if (!hasSupabase || !supabase) return [];
  const { data, error } = await supabase.from("profiles")
    .select("id,full_name,role,email")
    .in("role", ["super_admin", "editor"])
    .order("created_at");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export async function saveAdminUser(input: {
  action: "create" | "update";
  id?: string;
  full_name: string;
  email?: string;
  password?: string;
  role: Profile["role"];
}): Promise<void> {
  if (!hasSupabase || !supabase) throw new Error("User management requires Supabase");
  const { error } = await supabase.functions.invoke("manage-admin-user", { body: input });
  if (error) throw await functionError(error);
}

export async function deleteAdminUser(id: string): Promise<void> {
  if (!hasSupabase || !supabase) throw new Error("User management requires Supabase");
  const { error } = await supabase.functions.invoke("manage-admin-user", { body: { action: "delete", id } });
  if (error) throw await functionError(error);
}

// ---- Media ------------------------------------------------------------

export async function listMedia(): Promise<MediaItem[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("media").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return data as unknown as MediaItem[];
  }
  const db = getDb();
  return clone([...db.media].sort((a, b) => b.created_at.localeCompare(a.created_at)));
}

export async function addMedia(item: Omit<MediaItem, "id" | "created_at">): Promise<MediaItem> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("media").insert(item).select().single();
    if (error) throw error;
    return data as unknown as MediaItem;
  }
  return mutateDb((db) => {
    const next = { ...item, id: genId(), created_at: now() };
    db.media.unshift(next);
    recordAudit(db, "create", "media", next.id, null, next);
    return next;
  });
}

export async function updateMedia(id: string, alt_en: string, alt_bn: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("media").update({ alt_en, alt_bn }).eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const media = db.media.find((item) => item.id === id);
    if (!media) throw new Error("Media item not found");
    const before = { ...media };
    media.alt_en = alt_en;
    media.alt_bn = alt_bn;
    recordAudit(db, "update", "media", id, before, media);
  });
}

export async function uploadMedia(
  file: File,
  metadata: Pick<MediaItem, "alt_en" | "alt_bn">
): Promise<MediaItem> {
  const validated = mediaUploadSchema.safeParse({ file, ...metadata });
  if (!validated.success) throw new Error(validated.error.issues[0]?.message ?? "ফাইল যাচাই ব্যর্থ / File validation failed");
  const kind = file.type === "application/pdf" ? "pdf" : "image";
  if (hasSupabase && supabase) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${Date.now()}-${genId()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
    const { data, error } = await supabase.from("media").insert({ ...metadata, kind, url }).select().single();
    if (error) {
      const { error: cleanupError } = await supabase.storage.from(MEDIA_BUCKET).remove([path]);
      if (cleanupError) throw new Error(`${error.message}; storage cleanup failed: ${cleanupError.message}`);
      throw error;
    }
    return data as unknown as MediaItem;
  }
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("ফাইল পড়া যায়নি / Could not read file")));
    reader.onerror = () => reject(reader.error ?? new Error("ফাইল পড়া যায়নি / Could not read file"));
    reader.readAsDataURL(file);
  });
  return addMedia({ ...metadata, kind, url });
}

export async function deleteMedia(id: string): Promise<void> {
  if (hasSupabase && supabase) {
    const { data: item, error: readError } = await supabase.from("media").select("url").eq("id", id).single();
    if (readError) throw readError;
    const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
    const markerIndex = item.url.indexOf(marker);
    if (markerIndex < 0) throw new Error("Media URL does not belong to the configured storage bucket");
    const objectPath = decodeURIComponent(item.url.slice(markerIndex + marker.length));
    const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([objectPath]);
    if (storageError) throw storageError;
    const { error } = await supabase.from("media").delete().eq("id", id);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const before = db.media.find((item) => item.id === id);
    db.media = db.media.filter((item) => item.id !== id);
    recordAudit(db, "delete", "media", id, before ?? null, null);
  });
}

// ---- Audit log (read-only) ----------------------------------------------

export async function listAuditLog(): Promise<AuditLogEntry[]> {
  if (hasSupabase && supabase) {
    const { data, error } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return data as unknown as AuditLogEntry[];
  }
  const db = getDb();
  return clone(db.audit_log);
}

export async function verifySampleTestResults(): Promise<void> {
  if (hasSupabase && supabase) {
    const { error } = await supabase.from("test_results").update({ status: "verified" }).neq("status", "sample").eq("is_sample", false);
    if (error) throw error;
    return;
  }
  await mutateDb((db) => {
    const before = db.test_results.filter((result) => result.status !== "sample" && !result.is_sample);
    for (const result of db.test_results) {
      if (result.status !== "sample" && !result.is_sample) result.status = "verified";
    }
    recordAudit(db, "verify", "test_results", "non-sample", before, db.test_results.filter((result) => result.status === "verified"));
  });
}

export interface HealthCheck {
  database: boolean;
  storage: boolean;
  adminRole: boolean;
  publishedProducts: number;
  publishedArticles: number;
  missingSettings: string[];
}

export async function getHealthCheck(): Promise<HealthCheck> {
  if (hasSupabase && supabase) {
    const [
      products,
      articles,
      settings,
      storage,
      auth,
    ] = await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("is_published", true),
      supabase.from("articles").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("site_settings").select("key,value"),
      supabase.storage.from(MEDIA_BUCKET).list("", { limit: 1 }),
      supabase.auth.getUser(),
    ]);
    const error = products.error ?? articles.error ?? settings.error ?? storage.error ?? auth.error;
    if (error) throw error;
    const settingsMap = Object.fromEntries((settings.data ?? []).map((row) => [row.key, row.value])) as Record<string, unknown>;
    const missingSettings: string[] = [];
    if (!String(settingsMap.contact_email ?? "").trim()) missingSettings.push("contact email");
    for (const key of ["social_facebook", "social_youtube", "social_linkedin"]) {
      if (!String(settingsMap[key] ?? "").trim()) missingSettings.push(key.replace("social_", "") + " link");
    }
    let adminRole = false;
    if (auth.data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", auth.data.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      adminRole = !!profile;
    }
    return {
      database: true,
      storage: true,
      adminRole,
      publishedProducts: products.count ?? 0,
      publishedArticles: articles.count ?? 0,
      missingSettings,
    };
  }
  const db = getDb();
  const missingSettings = [
    !db.settings.contact_email.trim() ? "contact email" : "",
    !db.settings.social_facebook.trim() ? "facebook link" : "",
    !db.settings.social_youtube.trim() ? "youtube link" : "",
    !db.settings.social_linkedin.trim() ? "linkedin link" : "",
  ].filter(Boolean);
  return {
    database: true,
    storage: true,
    adminRole: sessionStorage.getItem("shonjibon.admin.authed") === "1",
    publishedProducts: db.products.filter((product) => product.is_published).length,
    publishedArticles: db.articles.filter((article) => article.status === "published").length,
    missingSettings,
  };
}

// ---- Backup / reset (mock mode helpers) ----------------------------------

export function exportBackup(): string {
  return JSON.stringify(getDb(), null, 2);
}

export function importBackup(json: string): void {
  let source: unknown;
  try {
    source = JSON.parse(json) as unknown;
  } catch {
    throw new Error("ব্যাকআপ JSON সঠিক নয় / Backup JSON is invalid");
  }
  const parsed = backupSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error("ব্যাকআপের গঠন সঠিক নয় / Backup structure is invalid");
  }
  setDb(parsed.data);
}

export function resetToDemoData(): void {
  resetDb();
}

export type {
  Article,
  ArticleCategory,
  CommunityVisit,
  Download,
  Faq,
  ImpactStat,
  JourneyMilestone,
  Order,
  Partner,
  Product,
  ResearchItem,
  Settings,
  TeamMember,
  Testimonial,
  TestResult,
};
