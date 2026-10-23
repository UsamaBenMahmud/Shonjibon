// Core bilingual content types mirroring supabase/001_init.sql
// Every *_en / *_bn pair represents one bilingual field.

export type Lang = "en" | "bn";

export type StockStatus = "in_stock" | "preorder" | "out_of_stock" | "coming_soon";
export type ArticleStatus = "draft" | "published" | "archived";
export type TestStatus = "pending" | "sample" | "verified";
export type OrderStatus = "new" | "confirmed" | "packed" | "delivered" | "cancelled";
export type GroupType = "team";
export type Role = "super_admin" | "editor" | "customer";

export interface WithTimestamps {
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  email?: string;
}

export interface SiteSettings {
  key: string;
  value: Record<string, unknown>;
}

export interface PageSection {
  id: string;
  page_key: "coastal" | "concerns" | "health" | "terms" | "privacy" | "refund" | "shipping";
  type: "text" | "cards" | "stats" | "quote" | "image" | "cta";
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  image: string;
  icon: string;
  source_name: string;
  source_url: string;
  is_sample: boolean;
  sort_order: number;
  is_visible: boolean;
}

export interface ShellPart {
  id: string;
  key: string;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
  icon: string;
  color: string;
  hotspot_x: number;
  hotspot_y: number;
  linked_product_ids: string[];
  sort_order: number;
  is_visible: boolean;
}

export interface NavItem {
  id: string;
  parent_id: string | null;
  label_en: string;
  label_bn: string;
  path: string;
  group_key: string;
  icon?: string;
  description_en?: string;
  description_bn?: string;
  is_visible: boolean;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_en: string;
  alt_bn: string;
  sort_order: number;
}

export interface ProductSpec {
  id: string;
  product_id: string;
  label_en: string;
  label_bn: string;
  value_en: string;
  value_bn: string;
  sort_order: number;
}

export interface ProductBenefit {
  id: string;
  product_id: string;
  icon: string;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  sort_order: number;
}

export interface ProcessStep {
  id: string;
  product_id: string | null;
  step_no: number;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  icon: string;
  sort_order: number;
}

export interface Product extends WithTimestamps {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string;
  tagline_en: string;
  tagline_bn: string;
  overview_en: string;
  overview_bn: string;
  trust_line_en: string;
  trust_line_bn: string;
  price: number;
  currency: string;
  price_note_en: string;
  price_note_bn: string;
  stock_status: StockStatus;
  is_flagship: boolean;
  is_published: boolean;
  cover_image: string;
  sort_order: number;
  sku?: string;
  category_id?: string | null;
  tags?: string[];
  sale_price?: number | null;
  stock_quantity?: number;
  low_stock_threshold?: number;
  weight?: number | null;
  delivery_note_en?: string;
  delivery_note_bn?: string;
  badges?: string[];
  is_featured?: boolean;
  seo_title_en?: string;
  seo_title_bn?: string;
  seo_description_en?: string;
  seo_description_bn?: string;
  images: ProductImage[];
  specs: ProductSpec[];
  benefits: ProductBenefit[];
  process_steps: ProcessStep[];
}

export interface ArticleCategory {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string;
  sort_order: number;
  is_published?: boolean;
}

export interface ProductCategory {
  id: string;
  slug: string;
  name_en: string;
  name_bn: string;
  sort_order: number;
  is_published: boolean;
}

export interface Article extends WithTimestamps {
  id: string;
  slug: string;
  category_id: string | null;
  title_en: string;
  title_bn: string;
  excerpt_en: string;
  excerpt_bn: string;
  body_en: string;
  body_bn: string;
  cover_image: string;
  author: string;
  status: ArticleStatus;
  published_at: string | null;
  seo_title_en: string;
  seo_title_bn: string;
  seo_description_en: string;
  seo_description_bn: string;
  sort_order?: number;
}

export interface JourneyMilestone {
  id: string;
  date_label_en: string;
  date_label_bn: string;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  image: string;
  sort_order: number;
  is_published?: boolean;
}

export type ResearchType = "method" | "finding" | "limitation" | "diagram";

export interface ResearchItem {
  id: string;
  type: ResearchType;
  title_en: string;
  title_bn: string;
  body_en: string;
  body_bn: string;
  image: string;
  sort_order: number;
  is_published?: boolean;
}

export interface TestResult {
  id: string;
  parameter_en: string;
  parameter_bn: string;
  unit: string;
  raw_value: number | null;
  filtered_value: number | null;
  control_value: number | null;
  standard_value: number | null;
  standard_source: string;
  lab_name: string;
  sample_date: string | null;
  status: TestStatus;
  sort_order: number;
  is_published?: boolean;
  is_sample?: boolean;
}

export interface ImpactStat {
  id: string;
  label_en: string;
  label_bn: string;
  value: number;
  prefix: string;
  suffix: string;
  is_sample: boolean;
  sort_order: number;
  is_published?: boolean;
  status?: "sample" | "target" | "verified";
  icon?: string;
  description_en?: string;
  description_bn?: string;
  link?: string;
  size?: "S" | "M" | "L";
  is_featured?: boolean;
  source_name?: string;
  source_url?: string;
}

export interface CommunityVisit {
  id: string;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  visit_date: string | null;
  cover_image: string;
  sort_order: number;
  photos: CommunityPhoto[];
  is_published?: boolean;
}

export interface CommunityPhoto {
  id: string;
  visit_id: string;
  url: string;
  caption_en: string;
  caption_bn: string;
  sort_order: number;
}

export interface TeamMember {
  id: string;
  group_type: GroupType;
  name: string;
  title_en: string;
  title_bn: string;
  department: string;
  bio_en: string;
  bio_bn: string;
  photo_url: string;
  links: Record<string, string>;
  sort_order: number;
  is_published?: boolean;
}

export interface Testimonial {
  id: string;
  name: string;
  role_en: string;
  role_bn: string;
  quote_en: string;
  quote_bn: string;
  avatar_url: string;
  is_sample: boolean;
  sort_order: number;
  is_published?: boolean;
}

export interface Faq {
  id: string;
  question_en: string;
  question_bn: string;
  answer_en: string;
  answer_bn: string;
  sort_order: number;
  is_published?: boolean;
}

export interface Partner {
  id: string;
  name: string;
  logo_url: string;
  url: string;
  sort_order: number;
  is_published?: boolean;
}

export interface Download {
  id: string;
  title_en: string;
  title_bn: string;
  file_url: string;
  file_type: string;
  sort_order: number;
  is_published?: boolean;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name_en: string;
  product_name_bn: string;
  unit_price: number;
  quantity: number;
}

export interface Order extends WithTimestamps {
  id: string;
  order_no: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  district: string;
  note: string;
  status: OrderStatus;
  total: number;
  user_id?: string | null;
  payment_method?: "cash_on_delivery" | "bank_transfer" | "mobile_money" | "sslcommerz";
  payment_status?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  items: OrderItem[];
}

export interface ContactMessage extends WithTimestamps {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
}

export interface Subscriber {
  id: string;
  email: string;
  created_at: string;
}

export interface MediaItem {
  id: string;
  url: string;
  alt_en: string;
  alt_bn: string;
  kind: "image" | "pdf";
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  table_name: string;
  record_id: string;
  before: unknown;
  after: unknown;
  created_at: string;
}

export interface CartLine {
  productId: string;
  slug: string;
  name_en: string;
  name_bn: string;
  price: number;
  currency: string;
  image: string;
  quantity: number;
}

export interface SectionToggles {
  hero: boolean;
  impact: boolean;
  shellDiagram: boolean;
  products: boolean;
  circularEconomy: boolean;
  wasteRing: boolean;
  journey: boolean;
  community: boolean;
  articles: boolean;
  team: boolean;
  testimonials: boolean;
  newsletter: boolean;
}

export interface ContactSettings {
  phone: string;
  email: string;
  address: string;
  hours: string;
  map_link: string;
  whatsapp_enabled: boolean;
}

export interface BrandingSettings {
  name_bn: string;
  name_en: string;
  show_bangla_name: boolean;
  logo_mark_url: string;
  logo_full_url: string;
  logo_dark_url: string;
  logo_height: number;
  use_mark_only?: boolean;
}

export interface ShellStorySettings {
  image_url: string;
  use_illustration: boolean;
}

export interface Settings {
  motto_en: string;
  motto_bn: string;
  hero_title_en: string;
  hero_title_bn: string;
  hero_subtitle_en: string;
  hero_subtitle_bn: string;
  contact_phone: string;
  contact_email: string;
  contact_address_en: string;
  contact_address_bn: string;
  social_facebook: string;
  social_youtube: string;
  social_linkedin: string;
  contact?: ContactSettings;
  branding?: BrandingSettings;
  shell_story?: ShellStorySettings;
  admin_password: string;
  sections: SectionToggles;
}
