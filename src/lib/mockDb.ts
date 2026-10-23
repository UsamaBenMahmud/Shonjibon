import { genId, nextOrderNo, slugify } from "@/lib/utils";
import type {
  Article,
  ArticleCategory,
  AuditLogEntry,
  CommunityPhoto,
  CommunityVisit,
  ContactMessage,
  Download,
  Faq,
  ImpactStat,
  JourneyMilestone,
  MediaItem,
  Order,
  OrderItem,
  PageSection,
  NavItem,
  Partner,
  Product,
  ProductCategory,
  ResearchItem,
  Settings,
  ShellPart,
  Subscriber,
  TeamMember,
  Testimonial,
  TestResult,
} from "@/lib/types";
import { makeDefaultNavItems, makeDefaultPageSections } from "@/lib/pageContent";

// ---------------------------------------------------------------------------
// Shonjibon mock "database": seeded demo content persisted to localStorage.
// Mirrors supabase/001_init.sql so swapping to real Supabase is a drop-in.
// ---------------------------------------------------------------------------

export interface DB {
  settings: Settings;
  products: Product[];
  product_categories: ProductCategory[];
  article_categories: ArticleCategory[];
  articles: Article[];
  journey_milestones: JourneyMilestone[];
  research_items: ResearchItem[];
  test_results: TestResult[];
  impact_stats: ImpactStat[];
  community_visits: CommunityVisit[];
  team_members: TeamMember[];
  testimonials: Testimonial[];
  faqs: Faq[];
  partners: Partner[];
  downloads: Download[];
  orders: Order[];
  contact_messages: ContactMessage[];
  subscribers: Subscriber[];
  media: MediaItem[];
  page_sections: PageSection[];
  shell_parts: ShellPart[];
  nav_items: NavItem[];
  audit_log: AuditLogEntry[];
  order_seq: number;
}

const DB_KEY = "shonjibon.db.v1";

const now = () => new Date().toISOString();

function img(seed: string, from: string, to: string): string {
  // Soft gradient "illustration" placeholder — always renders, never an empty box.
  const encoded = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='640' height='480' fill='url(#g)'/><text x='50%' y='52%' font-size='28' font-family='sans-serif' fill='white' text-anchor='middle' opacity='0.85'>${seed}</text></svg>`
  );
  return `data:image/svg+xml,${encoded}`;
}

function makeDefaultShellParts(): ShellPart[] {
  return [
    { id: genId(), key: "carapace", name_en: "Carapace", name_bn: "মাথার খোলস", description_en: "The hard head shell contains chitin, minerals, and proteins.", description_bn: "শক্ত মাথার খোলসে কাইটিন, খনিজ ও প্রোটিন থাকে।", icon: "shell", color: "coral", hotspot_x: 29, hotspot_y: 39, linked_product_ids: [], sort_order: 1, is_visible: true },
    { id: genId(), key: "abdomen", name_en: "Abdomen plates", name_bn: "পেটের খোলস", description_en: "The overlapping body plates are cleaned and prepared for processing.", description_bn: "একটির ওপর আরেকটি থাকা দেহের খোলস পরিষ্কার করে প্রক্রিয়ার জন্য প্রস্তুত করা হয়।", icon: "layers", color: "coral", hotspot_x: 60, hotspot_y: 50, linked_product_ids: [], sort_order: 2, is_visible: true },
    { id: genId(), key: "tail", name_en: "Tail fan", name_bn: "লেজের পাখা", description_en: "The tail fan is another part of the shell material that can be reused.", description_bn: "লেজের পাখাও পুনর্ব্যবহারযোগ্য খোলসের অংশ।", icon: "reuse", color: "teal", hotspot_x: 83, hotspot_y: 59, linked_product_ids: [], sort_order: 3, is_visible: true },
    { id: genId(), key: "layers", name_en: "Shell layers", name_bn: "খোলসের স্তর", description_en: "Shells contain a protein surface, chitin-protein fibers, and mineral material. Exact composition varies.", description_bn: "খোলসে প্রোটিনের উপরিভাগ, কাইটিন-প্রোটিন তন্তু ও খনিজ থাকে। সঠিক অনুপাত ভিন্ন হতে পারে।", icon: "layers", color: "teal", hotspot_x: 44, hotspot_y: 75, linked_product_ids: [], sort_order: 4, is_visible: true },
  ];
}

function buildSeed(): DB {
  const t = now();
  const ts = { created_at: t, updated_at: t };

  const products: Product[] = [
    {
      ...ts,
      id: "p-filter",
      slug: "shonjibon-water-filter",
      name_en: "Shonjibon Water Filter",
      name_bn: "সঞ্জীবন ওয়াটার ফিল্টার",
      tagline_en: "Gravity-fed, electricity-free, 5-layer filtration",
      tagline_bn: "মাধ্যাকর্ষণ-চালিত, বিদ্যুৎবিহীন ৫-স্তর ফিল্টার",
      overview_en:
        "Our flagship filter uses five layers — fine sand, a swappable chitosan cartridge, activated charcoal, sand, and coarse gravel — to help reduce arsenic, heavy metals and turbidity in household water, without electricity or moving parts.",
      overview_bn:
        "আমাদের ফ্ল্যাগশিপ ফিল্টারে পাঁচটি স্তর রয়েছে — সূক্ষ্ম বালি, পরিবর্তনযোগ্য কাইটোসান কার্তুজ, সক্রিয় কাঠকয়লা, বালি এবং মোটা নুড়িপাথর — যা বিদ্যুৎ বা কোনো চলমান যন্ত্রাংশ ছাড়াই বাড়ির পানিতে আর্সেনিক, ভারী ধাতু ও ঘোলাত্ব কমাতে সাহায্য করে।",
      trust_line_en: "Lab-tested with sample results; built with coastal households in mind.",
      trust_line_bn: "নমুনা ফলাফল সহ ল্যাব-পরীক্ষিত; উপকূলীয় পরিবারের কথা মাথায় রেখে তৈরি।",
      price: 1800,
      currency: "BDT",
      price_note_en: "Includes one chitosan cartridge; replacements sold separately.",
      price_note_bn: "একটি কাইটোসান কার্তুজ অন্তর্ভুক্ত; পরিবর্তনের কার্তুজ আলাদাভাবে পাওয়া যায়।",
      stock_status: "preorder",
      is_flagship: true,
      is_published: true,
      cover_image: img("Shonjibon Filter", "#127986", "#1A9AA8"),
      sort_order: 1,
      images: [
        { id: genId(), product_id: "p-filter", url: img("Filter — front", "#127986", "#1A9AA8"), alt_en: "Shonjibon filter, front view", alt_bn: "সঞ্জীবন ফিল্টার, সম্মুখ দৃশ্য", sort_order: 1 },
        { id: genId(), product_id: "p-filter", url: img("Filter — layers", "#0B3F4F", "#1A9AA8"), alt_en: "Cutaway of the 5 layers", alt_bn: "৫টি স্তরের ভেতরের দৃশ্য", sort_order: 2 },
        { id: genId(), product_id: "p-filter", url: img("Filter — cartridge", "#1A9AA8", "#F2795B"), alt_en: "Swappable chitosan cartridge", alt_bn: "পরিবর্তনযোগ্য কাইটোসান কার্তুজ", sort_order: 3 },
      ],
      specs: [
        { id: genId(), product_id: "p-filter", label_en: "Flow rate", label_bn: "প্রবাহ হার", value_en: "~1.5 L / 10 min (sample)", value_bn: "~১.৫ লিটার / ১০ মিনিট (নমুনা)", sort_order: 1 },
        { id: genId(), product_id: "p-filter", label_en: "Capacity", label_bn: "ধারণক্ষমতা", value_en: "12 L reservoir", value_bn: "১২ লিটার পাত্র", sort_order: 2 },
        { id: genId(), product_id: "p-filter", label_en: "Cartridge life", label_bn: "কার্তুজের স্থায়িত্ব", value_en: "~2 months household use (sample)", value_bn: "~২ মাস পারিবারিক ব্যবহার (নমুনা)", sort_order: 3 },
        { id: genId(), product_id: "p-filter", label_en: "Power needed", label_bn: "বিদ্যুৎ প্রয়োজন", value_en: "None — fully gravity-fed", value_bn: "প্রয়োজন নেই — সম্পূর্ণ মাধ্যাকর্ষণ-চালিত", sort_order: 4 },
        { id: genId(), product_id: "p-filter", label_en: "Body material", label_bn: "বডির উপাদান", value_en: "Food-grade plastic buckets", value_bn: "খাদ্য-গ্রেড প্লাস্টিক বালতি", sort_order: 5 },
      ],
      benefits: [
        { id: genId(), product_id: "p-filter", icon: "droplet", title_en: "Reduces arsenic & heavy metals", title_bn: "আর্সেনিক ও ভারী ধাতু কমায়", body_en: "Chitosan binds contaminants as water passes through.", body_bn: "পানি অতিক্রমের সময় কাইটোসান দূষক আটকে ফেলে।", sort_order: 1 },
        { id: genId(), product_id: "p-filter", icon: "bolt-off", title_en: "No electricity needed", title_bn: "বিদ্যুতের প্রয়োজন নেই", body_en: "Works anywhere with just gravity.", body_bn: "শুধু মাধ্যাকর্ষণেই যেকোনো জায়গায় কাজ করে।", sort_order: 2 },
        { id: genId(), product_id: "p-filter", icon: "coins", title_en: "Low cost to run", title_bn: "খরচ কম", body_en: "Affordable cartridge replacements made from local waste.", body_bn: "স্থানীয় বর্জ্য থেকে তৈরি সাশ্রয়ী কার্তুজ পরিবর্তন।", sort_order: 3 },
        { id: genId(), product_id: "p-filter", icon: "leaf", title_en: "From waste, for good", title_bn: "বর্জ্য থেকে কল্যাণে", body_en: "Every cartridge reuses shrimp-shell waste.", body_bn: "প্রতিটি কার্তুজ চিংড়ির খোলসের বর্জ্য পুনর্ব্যবহার করে।", sort_order: 4 },
      ],
      process_steps: [],
    },
    {
      ...ts,
      id: "p-shad",
      slug: "shonjibon-soyad",
      name_en: "Shonjibon Soyad",
      name_bn: "সঞ্জীবন সোয়াদ",
      tagline_en: "Shrimp-shell flour, a natural umami booster",
      tagline_bn: "চিংড়ির খোলসের গুঁড়া, প্রাকৃতিক উমামি বর্ধক",
      overview_en:
        "A fine flour milled from cleaned, dried shrimp shells. A pinch deepens the savoury flavour of soups, bhortas and curries.",
      overview_bn:
        "পরিষ্কার ও শুকনো চিংড়ির খোলস থেকে তৈরি মিহি গুঁড়া। সামান্য পরিমাণ স্যুপ, ভর্তা ও তরকারির স্বাদ গভীর করে তোলে।",
      trust_line_en: "Made in small batches; lab-checked for cleanliness.",
      trust_line_bn: "ছোট ব্যাচে তৈরি; পরিচ্ছন্নতার জন্য ল্যাবে পরীক্ষিত।",
      price: 150,
      currency: "BDT",
      price_note_en: "100g resealable pouch.",
      price_note_bn: "১০০ গ্রাম পুনঃবন্ধনযোগ্য প্যাকেট।",
      stock_status: "in_stock",
      is_flagship: false,
      is_published: true,
      cover_image: img("Shonjibon Soyad", "#F2795B", "#FBD9CF"),
      sort_order: 2,
      images: [
        { id: genId(), product_id: "p-shad", url: img("Soyad pouch", "#F2795B", "#FBD9CF"), alt_en: "Soyad flour pouch", alt_bn: "সোয়াদ গুঁড়ার প্যাকেট", sort_order: 1 },
      ],
      specs: [
        { id: genId(), product_id: "p-shad", label_en: "Net weight", label_bn: "নিট ওজন", value_en: "100 g", value_bn: "১০০ গ্রাম", sort_order: 1 },
        { id: genId(), product_id: "p-shad", label_en: "Shelf life", label_bn: "মেয়াদ", value_en: "6 months, store dry", value_bn: "৬ মাস, শুকনো স্থানে রাখুন", sort_order: 2 },
      ],
      benefits: [
        { id: genId(), product_id: "p-shad", icon: "sparkles", title_en: "Natural umami", title_bn: "প্রাকৃতিক উমামি", body_en: "No artificial flavouring.", body_bn: "কোনো কৃত্রিম স্বাদ নেই।", sort_order: 1 },
        { id: genId(), product_id: "p-shad", icon: "leaf", title_en: "Zero-waste origin", title_bn: "শূন্য-অপচয় উৎস", body_en: "Made entirely from shell byproduct.", body_bn: "সম্পূর্ণভাবে খোলসের উপজাত থেকে তৈরি।", sort_order: 2 },
      ],
      process_steps: [],
    },
    {
      ...ts,
      id: "p-ornaments",
      slug: "shell-craft-ornaments",
      name_en: "Shell-craft Ornaments",
      name_bn: "শেল-ক্রাফট অলংকার",
      tagline_en: "Handmade jewelry by women artisans",
      tagline_bn: "নারী কারিগরদের হাতে তৈরি গহনা",
      overview_en:
        "Earrings, pendants and bangles hand-shaped from cleaned shrimp-shell pieces by local women artisans, giving waste a second, beautiful life.",
      overview_bn:
        "স্থানীয় নারী কারিগরদের হাতে পরিষ্কার চিংড়ির খোলসের টুকরা থেকে তৈরি কানের দুল, পেন্ডেন্ট ও চুড়ি — বর্জ্যকে দেওয়া একটি সুন্দর দ্বিতীয় জীবন।",
      trust_line_en: "Every purchase supports artisan income.",
      trust_line_bn: "প্রতিটি কেনাকাটা কারিগরদের আয়ে সহায়তা করে।",
      price: 250,
      currency: "BDT",
      price_note_en: "Price varies by design; shown is the starting price.",
      price_note_bn: "ডিজাইন অনুযায়ী দাম ভিন্ন হতে পারে; এখানে সর্বনিম্ন মূল্য দেখানো হয়েছে।",
      stock_status: "in_stock",
      is_flagship: false,
      is_published: true,
      cover_image: img("Shell Ornaments", "#F2795B", "#0B3F4F"),
      sort_order: 3,
      images: [
        { id: genId(), product_id: "p-ornaments", url: img("Earrings", "#F2795B", "#0B3F4F"), alt_en: "Shell-craft earrings", alt_bn: "শেল-ক্রাফট কানের দুল", sort_order: 1 },
      ],
      specs: [
        { id: genId(), product_id: "p-ornaments", label_en: "Material", label_bn: "উপাদান", value_en: "Treated shrimp shell, local thread", value_bn: "প্রক্রিয়াজাত চিংড়ির খোলস, স্থানীয় সুতা", sort_order: 1 },
      ],
      benefits: [
        { id: genId(), product_id: "p-ornaments", icon: "heart", title_en: "Supports artisans", title_bn: "কারিগরদের সহায়তা করে", body_en: "Fair pay for every handmade piece.", body_bn: "প্রতিটি হাতে তৈরি পণ্যের জন্য ন্যায্য মজুরি।", sort_order: 1 },
      ],
      process_steps: [],
    },
    {
      ...ts,
      id: "p-chitoclear",
      slug: "chitoclear",
      name_en: "ChitoClear",
      name_bn: "কাইটোক্লিয়ার",
      tagline_en: "Chitosan water clarifier",
      tagline_bn: "কাইটোসান পানি স্বচ্ছকারী",
      overview_en:
        "A chitosan powder diluted in vinegar that helps clarify cloudy water. Mix, stir, let settle, then decant the clear water.",
      overview_bn:
        "ভিনেগারে মিশ্রিত কাইটোসান গুঁড়া যা ঘোলা পানি স্বচ্ছ করতে সাহায্য করে। মিশিয়ে নিন, নাড়ুন, থিতিয়ে যেতে দিন, তারপর স্বচ্ছ পানি আলাদা করুন।",
      trust_line_en: "Simple 4-step use; no equipment needed.",
      trust_line_bn: "সহজ ৪-ধাপ ব্যবহার; কোনো যন্ত্রপাতি প্রয়োজন নেই।",
      price: 120,
      currency: "BDT",
      price_note_en: "50g bottle, diluted in household vinegar.",
      price_note_bn: "৫০ গ্রাম বোতল, বাসার ভিনেগারে মিশিয়ে ব্যবহার করুন।",
      stock_status: "preorder",
      is_flagship: false,
      is_published: true,
      cover_image: img("ChitoClear", "#1A9AA8", "#F5FAFA"),
      sort_order: 4,
      images: [
        { id: genId(), product_id: "p-chitoclear", url: img("ChitoClear bottle", "#1A9AA8", "#F5FAFA"), alt_en: "ChitoClear bottle", alt_bn: "কাইটোক্লিয়ার বোতল", sort_order: 1 },
      ],
      specs: [
        { id: genId(), product_id: "p-chitoclear", label_en: "Net weight", label_bn: "নিট ওজন", value_en: "50 g", value_bn: "৫০ গ্রাম", sort_order: 1 },
        { id: genId(), product_id: "p-chitoclear", label_en: "Use", label_bn: "ব্যবহার", value_en: "Mix → stir → settle → decant", value_bn: "মিশ্রণ → নাড়া → থিতানো → আলাদা করা", sort_order: 2 },
      ],
      benefits: [
        { id: genId(), product_id: "p-chitoclear", icon: "droplet", title_en: "Clarifies cloudy water", title_bn: "ঘোলা পানি স্বচ্ছ করে", body_en: "Helps turbidity settle out faster.", body_bn: "ঘোলাত্ব দ্রুত থিতিয়ে যেতে সাহায্য করে।", sort_order: 1 },
      ],
      process_steps: [],
    },
    {
      ...ts,
      id: "p-agri",
      slug: "agri-shelf-life-powder",
      name_en: "Agri Shelf-Life Powder",
      name_bn: "কৃষি শেল্ফ-লাইফ গুঁড়া",
      tagline_en: "Chitosan coating for produce and seeds",
      tagline_bn: "ফসল ও বীজের জন্য কাইটোসান আবরণ",
      overview_en:
        "A thin chitosan coating applied to fruits, vegetables or seeds to help extend shelf life and reduce spoilage.",
      overview_bn:
        "ফল, সবজি বা বীজে প্রয়োগের জন্য পাতলা কাইটোসান আবরণ, যা মেয়াদ বাড়াতে ও নষ্ট হওয়া কমাতে সাহায্য করে।",
      trust_line_en: "Field trials ongoing with local farmers.",
      trust_line_bn: "স্থানীয় কৃষকদের সাথে মাঠ পরীক্ষা চলমান।",
      price: 200,
      currency: "BDT",
      price_note_en: "100g pack, dilute before use.",
      price_note_bn: "১০০ গ্রাম প্যাক, ব্যবহারের আগে পাতলা করুন।",
      stock_status: "coming_soon",
      is_flagship: false,
      is_published: true,
      cover_image: img("Agri Powder", "#1A9AA8", "#F3EADB"),
      sort_order: 5,
      images: [
        { id: genId(), product_id: "p-agri", url: img("Agri powder pack", "#1A9AA8", "#F3EADB"), alt_en: "Agri shelf-life powder pack", alt_bn: "কৃষি শেল্ফ-লাইফ গুঁড়ার প্যাক", sort_order: 1 },
      ],
      specs: [
        { id: genId(), product_id: "p-agri", label_en: "Net weight", label_bn: "নিট ওজন", value_en: "100 g", value_bn: "১০০ গ্রাম", sort_order: 1 },
      ],
      benefits: [
        { id: genId(), product_id: "p-agri", icon: "leaf", title_en: "Extends shelf life", title_bn: "মেয়াদ বাড়ায়", body_en: "Early trials show reduced spoilage (sample).", body_bn: "প্রাথমিক পরীক্ষায় কম নষ্ট হওয়ার ইঙ্গিত (নমুনা)।", sort_order: 1 },
      ],
      process_steps: [],
    },
  ];

  const globalProcessSteps = [
    { title_en: "Collect", title_bn: "সংগ্রহ", body_en: "Shrimp shells collected from Chuknagar and MU Sea Food.", body_bn: "চুকনগর ও এমইউ সি ফুড থেকে চিংড়ির খোলস সংগ্রহ করা হয়।", icon: "truck" },
    { title_en: "Clean & dry", title_bn: "পরিষ্কার ও শুকানো", body_en: "Shells are washed, sun-dried and ground.", body_bn: "খোলস ধোয়া, রোদে শুকানো ও গুঁড়া করা হয়।", icon: "sun" },
    { title_en: "Extract chitosan", title_bn: "কাইটোসান নিষ্কাশন", body_en: "Demineralization, deproteinization and deacetylation yield chitosan.", body_bn: "ডিমিনারেলাইজেশন, ডিপ্রোটিনাইজেশন ও ডিএসিটাইলেশনের মাধ্যমে কাইটোসান পাওয়া যায়।", icon: "flask" },
    { title_en: "Build & test", title_bn: "তৈরি ও পরীক্ষা", body_en: "Cartridges are assembled and lab-tested.", body_bn: "কার্তুজ তৈরি ও ল্যাবে পরীক্ষা করা হয়।", icon: "check" },
  ];
  products[0].process_steps = globalProcessSteps.map((s, i) => ({
    id: genId(),
    product_id: "p-filter",
    step_no: i + 1,
    sort_order: i + 1,
    ...s,
  }));

  for (const product of products) {
    product.stock_quantity ??= product.stock_status === "out_of_stock" ? 0 : 10;
    product.low_stock_threshold ??= 5;
    product.sku ??= product.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
    product.is_featured ??= product.is_flagship;
  }

  const article_categories: ArticleCategory[] = [
    { id: "cat-waterborne", slug: "water-borne-diseases", name_en: "Water-borne diseases", name_bn: "পানিবাহিত রোগ", sort_order: 1 },
    { id: "cat-arsenic", slug: "arsenic-awareness", name_en: "Arsenic awareness", name_bn: "আর্সেনিক সচেতনতা", sort_order: 2 },
    { id: "cat-safety", slug: "water-safety-tips", name_en: "Water safety tips", name_bn: "পানি নিরাপত্তা পরামর্শ", sort_order: 3 },
    { id: "cat-research", slug: "research-updates", name_en: "Research updates", name_bn: "গবেষণার হালনাগাদ", sort_order: 4 },
    { id: "cat-field", slug: "field-visit-stories", name_en: "Field visit stories", name_bn: "মাঠ পরিদর্শনের গল্প", sort_order: 5 },
  ];

  const articles: Article[] = [
    {
      ...ts,
      id: genId(),
      slug: "why-arsenic-is-a-silent-crisis",
      category_id: "cat-arsenic",
      title_en: "Why arsenic is a silent crisis in coastal Bangladesh",
      title_bn: "কেন আর্সেনিক উপকূলীয় বাংলাদেশে নীরব এক সংকট",
      excerpt_en: "Arsenic in groundwater has no taste or smell — which is exactly what makes it dangerous.",
      excerpt_bn: "ভূগর্ভস্থ পানিতে আর্সেনিকের কোনো স্বাদ বা গন্ধ নেই — এটাই একে বিপজ্জনক করে তোলে।",
      body_en: "<p>Arsenic contamination in groundwater affects millions across Bangladesh, especially in coastal and low-lying districts. Because it cannot be seen, tasted or smelled, long-term exposure often goes unnoticed until health effects appear.</p><p>Simple, affordable household filtration — alongside regular water testing — is one practical layer of protection while larger infrastructure solutions are built out.</p>",
      body_bn: "<p>ভূগর্ভস্থ পানিতে আর্সেনিক দূষণ বাংলাদেশের লক্ষ লক্ষ মানুষকে প্রভাবিত করে, বিশেষ করে উপকূলীয় ও নিচু এলাকায়। এটি দেখা, স্বাদ নেওয়া বা গন্ধ পাওয়া যায় না বলে দীর্ঘমেয়াদী সংস্পর্শ প্রায়ই স্বাস্থ্য সমস্যা দেখা না দেওয়া পর্যন্ত অগোচরে থেকে যায়।</p><p>সহজ, সাশ্রয়ী পারিবারিক ফিল্টারিং — নিয়মিত পানি পরীক্ষার পাশাপাশি — বড় অবকাঠামো সমাধান তৈরি হওয়ার সময় একটি বাস্তবসম্মত সুরক্ষা স্তর।</p>",
      cover_image: img("Arsenic Awareness", "#0B3F4F", "#1A9AA8"),
      author: "Parboti Rani Sarkar",
      status: "published",
      published_at: t,
      seo_title_en: "Why arsenic is a silent crisis in coastal Bangladesh",
      seo_title_bn: "কেন আর্সেনিক উপকূলীয় বাংলাদেশে নীরব এক সংকট",
      seo_description_en: "Understanding arsenic contamination risk in coastal groundwater.",
      seo_description_bn: "উপকূলীয় ভূগর্ভস্থ পানিতে আর্সেনিক দূষণের ঝুঁকি বোঝা।",
    },
    {
      ...ts,
      id: genId(),
      slug: "five-signs-of-water-borne-illness",
      category_id: "cat-waterborne",
      title_en: "Five early signs of water-borne illness",
      title_bn: "পানিবাহিত রোগের পাঁচটি প্রাথমিক লক্ষণ",
      excerpt_en: "Recognising symptoms early can prevent serious complications, especially in children.",
      excerpt_bn: "প্রাথমিক পর্যায়ে লক্ষণ চিনতে পারলে, বিশেষত শিশুদের ক্ষেত্রে গুরুতর জটিলতা এড়ানো যায়।",
      body_en: "<p>Diarrhoea, stomach cramps, fatigue, skin irritation and discoloured water are common early warning signs linked to unsafe drinking water. Boiling, SODIS solar disinfection, and simple filtration can all reduce risk when used together.</p>",
      body_bn: "<p>ডায়রিয়া, পেট ব্যথা, ক্লান্তি, ত্বকে জ্বালাপোড়া ও পানির রঙ পরিবর্তন অনিরাপদ পানীয় জলের সাথে যুক্ত সাধারণ প্রাথমিক লক্ষণ। ফুটানো, সোডিস সৌর জীবাণুমুক্তকরণ ও সাধারণ ফিল্টারিং একসাথে ব্যবহার করলে ঝুঁকি কমানো যায়।</p>",
      cover_image: img("Water-borne Illness", "#1A9AA8", "#0B3F4F"),
      author: "Samia Islam Jim",
      status: "published",
      published_at: t,
      seo_title_en: "Five early signs of water-borne illness",
      seo_title_bn: "পানিবাহিত রোগের পাঁচটি প্রাথমিক লক্ষণ",
      seo_description_en: "Common symptoms linked to unsafe drinking water.",
      seo_description_bn: "অনিরাপদ পানীয় জলের সাথে যুক্ত সাধারণ লক্ষণ।",
    },
    {
      ...ts,
      id: genId(),
      slug: "sodis-solar-disinfection-explained",
      category_id: "cat-safety",
      title_en: "SODIS: solar disinfection explained simply",
      title_bn: "সোডিস: সহজভাবে সৌর জীবাণুমুক্তকরণ বোঝা",
      excerpt_en: "Clear bottles, direct sunlight, six hours — a free way to reduce germs in water.",
      excerpt_bn: "স্বচ্ছ বোতল, সরাসরি রোদ, ছয় ঘণ্টা — পানিতে জীবাণু কমানোর একটি বিনামূল্যের উপায়।",
      body_en: "<p>SODIS (Solar Water Disinfection) uses UV rays from sunlight to inactivate many pathogens. Fill a clean, clear PET bottle with water, shake briefly to oxygenate, then lay it in direct sunlight for at least six hours. It pairs well with the Shonjibon filter, which focuses on arsenic, heavy metals and turbidity rather than germs.</p>",
      body_bn: "<p>সোডিস (সৌর পানি জীবাণুমুক্তকরণ) সূর্যের অতিবেগুনি রশ্মি ব্যবহার করে অনেক জীবাণু নিষ্ক্রিয় করে। একটি পরিষ্কার স্বচ্ছ পিইটি বোতলে পানি ভরে, কিছুক্ষণ ঝাঁকিয়ে অক্সিজেন মিশিয়ে, অন্তত ছয় ঘণ্টা সরাসরি রোদে রাখুন। এটি সঞ্জীবন ফিল্টারের সাথে ভালোভাবে মানানসই, যা মূলত আর্সেনিক, ভারী ধাতু ও ঘোলাত্বের উপর কেন্দ্রীভূত, জীবাণুর উপর নয়।</p>",
      cover_image: img("SODIS", "#F2795B", "#1A9AA8"),
      author: "Anika Tabassum Akhy",
      status: "published",
      published_at: t,
      seo_title_en: "SODIS solar disinfection explained",
      seo_title_bn: "সোডিস সৌর জীবাণুমুক্তকরণ ব্যাখ্যা",
      seo_description_en: "A free way to reduce germs in drinking water using sunlight.",
      seo_description_bn: "সূর্যের আলো ব্যবহার করে পানীয় জলে জীবাণু কমানোর বিনামূল্যের উপায়।",
    },
    {
      ...ts,
      id: genId(),
      slug: "inside-our-chitosan-extraction-lab",
      category_id: "cat-research",
      title_en: "Inside our chitosan extraction process",
      title_bn: "আমাদের কাইটোসান নিষ্কাশন প্রক্রিয়ার ভেতরে",
      excerpt_en: "Four lab steps turn shrimp-shell waste into a water-purifying material.",
      excerpt_bn: "চারটি ল্যাব ধাপ চিংড়ির খোলসের বর্জ্যকে পানি বিশুদ্ধকারী উপাদানে রূপান্তর করে।",
      body_en: "<p>From cleaning to deacetylation, each step removes a different component of the shell until pure chitosan remains. Our team runs this process in small batches, testing consistency along the way.</p>",
      body_bn: "<p>পরিষ্কার করা থেকে শুরু করে ডিএসিটাইলেশন পর্যন্ত, প্রতিটি ধাপ খোলসের ভিন্ন ভিন্ন উপাদান সরিয়ে দেয় যতক্ষণ না বিশুদ্ধ কাইটোসান অবশিষ্ট থাকে। আমাদের টিম ছোট ব্যাচে এই প্রক্রিয়া চালায়, পথে ধারাবাহিকতা পরীক্ষা করে।</p>",
      cover_image: img("Lab Process", "#127986", "#0B3F4F"),
      author: "Usama Ben Mahmud",
      status: "published",
      published_at: t,
      seo_title_en: "Inside our chitosan extraction process",
      seo_title_bn: "আমাদের কাইটোসান নিষ্কাশন প্রক্রিয়ার ভেতরে",
      seo_description_en: "A look at our 4-step chitosan extraction lab process.",
      seo_description_bn: "আমাদের ৪-ধাপ কাইটোসান নিষ্কাশন প্রক্রিয়ার একটি পর্যালোচনা।",
    },
    {
      ...ts,
      id: genId(),
      slug: "a-morning-at-chuknagar",
      category_id: "cat-field",
      title_en: "A morning at Chuknagar: where our journey begins",
      title_bn: "চুকনগরে একটি সকাল: যেখানে আমাদের যাত্রা শুরু",
      excerpt_en: "Shell collection starts long before any lab work — it starts at the market.",
      excerpt_bn: "খোলস সংগ্রহ যেকোনো ল্যাবের কাজের অনেক আগেই শুরু হয় — এটি শুরু হয় বাজারে।",
      body_en: "<p>Every week, our team visits Chuknagar's shrimp market to collect shell waste that would otherwise be discarded. Local traders have become partners in this small circular economy.</p>",
      body_bn: "<p>প্রতি সপ্তাহে, আমাদের টিম চুকনগরের চিংড়ি বাজারে যায় খোলসের বর্জ্য সংগ্রহ করতে, যা অন্যথায় ফেলে দেওয়া হতো। স্থানীয় ব্যবসায়ীরা এই ছোট বৃত্তাকার অর্থনীতির অংশীদার হয়ে উঠেছেন।</p>",
      cover_image: img("Chuknagar Visit", "#1A9AA8", "#F3EADB"),
      author: "Mrinmoy Mondal",
      status: "published",
      published_at: t,
      seo_title_en: "A morning at Chuknagar",
      seo_title_bn: "চুকনগরে একটি সকাল",
      seo_description_en: "How Shonjibon collects shrimp shell waste from Chuknagar market.",
      seo_description_bn: "সঞ্জীবন কীভাবে চুকনগর বাজার থেকে চিংড়ির খোলসের বর্জ্য সংগ্রহ করে।",
    },
    {
      ...ts,
      id: genId(),
      slug: "visiting-mu-sea-food",
      category_id: "cat-field",
      title_en: "Visiting MU Sea Food: a partnership in waste",
      title_bn: "এমইউ সি ফুড পরিদর্শন: বর্জ্যে একটি অংশীদারিত্ব",
      excerpt_en: "Manager Shubrato Babu walked us through their processing line.",
      excerpt_bn: "ম্যানেজার শুভ্রত বাবু আমাদের তাদের প্রক্রিয়াকরণ লাইন ঘুরিয়ে দেখিয়েছেন।",
      body_en: "<p>MU Sea Food processes large volumes of shrimp for export, generating substantial shell waste daily. Our visit, hosted by manager Shubrato Babu, confirmed a steady supply chain for our raw material.</p>",
      body_bn: "<p>এমইউ সি ফুড রপ্তানির জন্য প্রচুর পরিমাণে চিংড়ি প্রক্রিয়াজাত করে, প্রতিদিন যথেষ্ট পরিমাণ খোলসের বর্জ্য তৈরি করে। ম্যানেজার শুভ্রত বাবুর আতিথেয়তায় আমাদের পরিদর্শন আমাদের কাঁচামালের একটি স্থিতিশীল সরবরাহ ব্যবস্থা নিশ্চিত করেছে।</p>",
      cover_image: img("MU Sea Food", "#0B3F4F", "#F2795B"),
      author: "Jannatul Mawoa Esha",
      status: "published",
      published_at: t,
      seo_title_en: "Visiting MU Sea Food",
      seo_title_bn: "এমইউ সি ফুড পরিদর্শন",
      seo_description_en: "Our partnership with MU Sea Food for shell waste sourcing.",
      seo_description_bn: "খোলস বর্জ্য সংগ্রহের জন্য এমইউ সি ফুডের সাথে আমাদের অংশীদারিত্ব।",
    },
  ];

  const journey_milestones: JourneyMilestone[] = [
    { id: genId(), date_label_en: "Jan 2026", date_label_bn: "জানুয়ারি ২০২৬", title_en: "Idea & research begins", title_bn: "ধারণা ও গবেষণা শুরু", body_en: "Team forms under JUST Cohort 2026.", body_bn: "JUST কোহর্ট ২০২৬-এর অধীনে টিম গঠিত হয়।", image: img("Idea", "#1A9AA8", "#0B3F4F"), sort_order: 1 },
    { id: genId(), date_label_en: "Feb 2026", date_label_bn: "ফেব্রুয়ারি ২০২৬", title_en: "First shell collection", title_bn: "প্রথম খোলস সংগ্রহ", body_en: "Visited Chuknagar market for raw shells.", body_bn: "কাঁচা খোলসের জন্য চুকনগর বাজার পরিদর্শন।", image: img("Collection", "#127986", "#1A9AA8"), sort_order: 2 },
    { id: genId(), date_label_en: "Mar 2026", date_label_bn: "মার্চ ২০২৬", title_en: "Lab extraction trials", title_bn: "ল্যাব নিষ্কাশন পরীক্ষা", body_en: "First chitosan batches produced.", body_bn: "প্রথম কাইটোসান ব্যাচ তৈরি হয়।", image: img("Lab Trials", "#0B3F4F", "#1A9AA8"), sort_order: 3 },
    { id: genId(), date_label_en: "Apr 2026", date_label_bn: "এপ্রিল ২০২৬", title_en: "First filter prototype", title_bn: "প্রথম ফিল্টার প্রোটোটাইপ", body_en: "5-layer design assembled and tested.", body_bn: "৫-স্তর ডিজাইন তৈরি ও পরীক্ষা করা হয়।", image: img("Prototype", "#1A9AA8", "#F2795B"), sort_order: 4 },
    { id: genId(), date_label_en: "May 2026", date_label_bn: "মে ২০২৬", title_en: "MU Sea Food partnership", title_bn: "এমইউ সি ফুড অংশীদারিত্ব", body_en: "Secured a steady shell supply chain.", body_bn: "স্থিতিশীল খোলস সরবরাহ ব্যবস্থা নিশ্চিত করা হয়।", image: img("Partnership", "#0B3F4F", "#F2795B"), sort_order: 5 },
    { id: genId(), date_label_en: "Jun 2026", date_label_bn: "জুন ২০২৬", title_en: "Pitch & pilot households", title_bn: "পিচ ও পাইলট পরিবার", body_en: "First pilot filters placed with households.", body_bn: "পাইলট ফিল্টার প্রথম পরিবারগুলোতে স্থাপন করা হয়।", image: img("Pilot", "#1A9AA8", "#0B3F4F"), sort_order: 6 },
  ];

  const research_items: ResearchItem[] = [
    { id: genId(), type: "method", title_en: "1. Cleaning", title_bn: "১. পরিষ্কারকরণ", body_en: "Shells are washed to remove residual tissue and debris.", body_bn: "অবশিষ্ট মাংস ও ময়লা দূর করতে খোলস ধোয়া হয়।", image: img("Cleaning", "#1A9AA8", "#F5FAFA"), sort_order: 1 },
    { id: genId(), type: "method", title_en: "2. Demineralization", title_bn: "২. ডিমিনারেলাইজেশন", body_en: "Dilute acid removes calcium carbonate from the shell.", body_bn: "হালকা অ্যাসিড খোলস থেকে ক্যালসিয়াম কার্বনেট দূর করে।", image: img("Demineralization", "#127986", "#1A9AA8"), sort_order: 2 },
    { id: genId(), type: "method", title_en: "3. Deproteinization", title_bn: "৩. ডিপ্রোটিনাইজেশন", body_en: "Dilute alkali removes proteins, leaving raw chitin.", body_bn: "হালকা ক্ষার প্রোটিন দূর করে, কাঁচা কাইটিন রেখে যায়।", image: img("Deproteinization", "#0B3F4F", "#1A9AA8"), sort_order: 3 },
    { id: genId(), type: "method", title_en: "4. Deacetylation", title_bn: "৪. ডিএসিটাইলেশন", body_en: "Concentrated alkali under heat converts chitin into chitosan.", body_bn: "তাপে ঘন ক্ষার কাইটিনকে কাইটোসানে রূপান্তর করে।", image: img("Deacetylation", "#1A9AA8", "#F2795B"), sort_order: 4 },
    { id: genId(), type: "finding", title_en: "Turbidity drops sharply", title_bn: "ঘোলাত্ব দ্রুত কমে", body_en: "Sample testing shows a large reduction after filtration.", body_bn: "নমুনা পরীক্ষায় ফিল্টারিংয়ের পর বড় হ্রাস দেখা যায়।", image: img("Finding", "#1A9AA8", "#0B3F4F"), sort_order: 5 },
    { id: genId(), type: "limitation", title_en: "Not a substitute for lab-grade systems", title_bn: "ল্যাব-গ্রেড সিস্টেমের বিকল্প নয়", body_en: "Household results vary with source water quality.", body_bn: "উৎস পানির মানভেদে পারিবারিক ফলাফল ভিন্ন হতে পারে।", image: img("Limitation", "#4F6F77", "#0B3F4F"), sort_order: 6 },
    { id: genId(), type: "limitation", title_en: "Does not remove salinity", title_bn: "লবণাক্ততা দূর করে না", body_en: "Pair with rainwater harvesting in saline-prone areas.", body_bn: "লবণাক্ত এলাকায় বৃষ্টির পানি সংগ্রহের সাথে ব্যবহার করুন।", image: img("Salinity Note", "#4F6F77", "#1A9AA8"), sort_order: 7 },
  ];

  const test_results: TestResult[] = [
    { id: genId(), parameter_en: "Turbidity", parameter_bn: "ঘোলাত্ব", unit: "NTU", raw_value: 38, filtered_value: 4.2, control_value: 36, standard_value: 10, standard_source: "ECR/DPHE", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 1 },
    { id: genId(), parameter_en: "pH", parameter_bn: "পিএইচ", unit: "pH", raw_value: 6.4, filtered_value: 7.0, control_value: 6.5, standard_value: 7.5, standard_source: "WHO", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 2 },
    { id: genId(), parameter_en: "TDS", parameter_bn: "টিডিএস", unit: "mg/L", raw_value: 620, filtered_value: 540, control_value: 610, standard_value: 1000, standard_source: "ECR/DPHE", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 3 },
    { id: genId(), parameter_en: "Arsenic", parameter_bn: "আর্সেনিক", unit: "mg/L", raw_value: 0.09, filtered_value: 0.02, control_value: 0.08, standard_value: 0.05, standard_source: "ECR/DPHE", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 4 },
    { id: genId(), parameter_en: "Iron", parameter_bn: "আয়রন", unit: "mg/L", raw_value: 1.2, filtered_value: 0.4, control_value: 1.1, standard_value: 0.3, standard_source: "ECR/DPHE", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 5 },
    { id: genId(), parameter_en: "Chloride", parameter_bn: "ক্লোরাইড", unit: "mg/L", raw_value: 410, filtered_value: 395, control_value: 405, standard_value: 600, standard_source: "ECR/DPHE", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 6 },
    { id: genId(), parameter_en: "Lead", parameter_bn: "সীসা", unit: "mg/L", raw_value: 0.02, filtered_value: 0.004, control_value: 0.018, standard_value: 0.01, standard_source: "WHO", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 7 },
    { id: genId(), parameter_en: "Cadmium", parameter_bn: "ক্যাডমিয়াম", unit: "mg/L", raw_value: 0.006, filtered_value: 0.001, control_value: 0.006, standard_value: 0.003, standard_source: "WHO", lab_name: "University lab (sample)", sample_date: t, status: "sample", is_sample: true, sort_order: 8 },
    { id: genId(), parameter_en: "E. coli", parameter_bn: "ই-কোলাই", unit: "CFU/100mL", raw_value: null, filtered_value: null, control_value: null, standard_value: 0, standard_source: "WHO", lab_name: "Pending partner lab", sample_date: null, status: "pending", sort_order: 9 },
  ];

  const impact_stats: ImpactStat[] = [
    { id: genId(), label_en: "Shell waste diverted", label_bn: "পুনর্ব্যবহৃত খোলস", value: 180, prefix: "", suffix: " kg", is_sample: true, status: "sample", icon: "♻", description_en: "Illustrative sample only; replace with measured collection data.", description_bn: "শুধু নমুনা; প্রকৃত সংগ্রহের তথ্য দিয়ে পরিবর্তন করুন।", link: "/community", size: "L", is_featured: true, sort_order: 1 },
    { id: genId(), label_en: "Products from one waste", label_bn: "এক বর্জ্য থেকে পণ্য", value: 5, prefix: "", suffix: "", is_sample: false, status: "target", icon: "✳", description_en: "One filter and four shell-based byproducts.", description_bn: "একটি ফিল্টার ও খোলস-ভিত্তিক চারটি উপজাত পণ্য।", link: "/shell", size: "M", sort_order: 2 },
    { id: genId(), label_en: "Districts we target", label_bn: "লক্ষ্য জেলা", value: 3, prefix: "", suffix: "", is_sample: false, status: "target", icon: "⌖", description_en: "Satkhira, Khulna, and Bagerhat.", description_bn: "সাতক্ষীরা, খুলনা ও বাগেরহাট।", link: "/coastal-problem", size: "M", sort_order: 3 },
    { id: genId(), label_en: "Women in shell work", label_bn: "খোলসের কাজে নারী", value: 0, prefix: "", suffix: "", is_sample: false, status: "target", icon: "♡", description_en: "A target for inclusive collection and crafts.", description_bn: "অন্তর্ভুক্তিমূলক সংগ্রহ ও কারুশিল্পের লক্ষ্য।", link: "/community", size: "S", sort_order: 4 },
    { id: genId(), label_en: "People at risk in target area", label_bn: "লক্ষ্য এলাকার ঝুঁকিতে থাকা মানুষ", value: 2500000, prefix: "≈", suffix: "", is_sample: true, status: "sample", icon: "◎", description_en: "Approximate illustrative figure; add a credible source before presenting as verified.", description_bn: "আনুমানিক নমুনা তথ্য; যাচাইকৃত হিসেবে দেখানোর আগে নির্ভরযোগ্য উৎস যোগ করুন।", link: "/coastal-problem", size: "M", sort_order: 5 },
    { id: genId(), label_en: "Lab tests completed", label_bn: "সম্পন্ন ল্যাব পরীক্ষা", value: 0, prefix: "", suffix: " / 8", is_sample: false, status: "target", icon: "⌕", description_en: "Completed verified tests compared with the planned set.", description_bn: "পরিকল্পিত পরীক্ষার তুলনায় সম্পন্ন যাচাইকৃত পরীক্ষা।", link: "/lab-results", size: "M", sort_order: 6 },
    { id: genId(), label_en: "Pilot households", label_bn: "পাইলট পরিবার", value: 12, prefix: "", suffix: "+", is_sample: false, status: "target", icon: "⌂", description_en: "A target for a future community pilot.", description_bn: "ভবিষ্যৎ কমিউনিটি পাইলটের লক্ষ্য।", link: "/community", size: "S", sort_order: 7 },
  ];

  const communityPhotosFor = (visitId: string, label: string, n: number): CommunityPhoto[] =>
    Array.from({ length: n }).map((_, i) => ({
      id: genId(),
      visit_id: visitId,
      url: img(`${label} ${i + 1}`, i % 2 === 0 ? "#1A9AA8" : "#0B3F4F", i % 2 === 0 ? "#0B3F4F" : "#F2795B"),
      caption_en: `${label} — moment ${i + 1}`,
      caption_bn: `${label} — মুহূর্ত ${i + 1}`,
      sort_order: i + 1,
    }));

  const visitChuk = "visit-chuknagar";
  const visitMu = "visit-musea";
  const visitLab = "visit-lab";
  const community_visits: CommunityVisit[] = [
    {
      id: visitChuk,
      title_en: "Chuknagar shell collection",
      title_bn: "চুকনগর খোলস সংগ্রহ",
      description_en: "Weekly collection trips to Chuknagar shrimp market.",
      description_bn: "চুকনগর চিংড়ি বাজারে সাপ্তাহিক সংগ্রহ সফর।",
      visit_date: t,
      cover_image: img("Chuknagar", "#1A9AA8", "#0B3F4F"),
      sort_order: 1,
      photos: communityPhotosFor(visitChuk, "Chuknagar", 4),
    },
    {
      id: visitMu,
      title_en: "MU Sea Food visit",
      title_bn: "এমইউ সি ফুড পরিদর্শন",
      description_en: "Touring the processing line with manager Shubrato Babu.",
      description_bn: "ম্যানেজার শুভ্রত বাবুর সাথে প্রক্রিয়াকরণ লাইন ঘুরে দেখা।",
      visit_date: t,
      cover_image: img("MU Sea Food", "#0B3F4F", "#F2795B"),
      sort_order: 2,
      photos: communityPhotosFor(visitMu, "MU Sea Food", 4),
    },
    {
      id: visitLab,
      title_en: "Lab shell-grinding day",
      title_bn: "ল্যাব খোলস-গুঁড়াকরণ দিন",
      description_en: "Grinding and preparing shells for chitosan extraction.",
      description_bn: "কাইটোসান নিষ্কাশনের জন্য খোলস গুঁড়া ও প্রস্তুত করা।",
      visit_date: t,
      cover_image: img("Lab Grinding", "#127986", "#1A9AA8"),
      sort_order: 3,
      photos: communityPhotosFor(visitLab, "Lab", 3),
    },
  ];

  const team_members: TeamMember[] = [
    { id: genId(), group_type: "team", name: "Usama Ben Mahmud", title_en: "Team Lead & Technology", title_bn: "টিম লিড ও প্রযুক্তি", department: "Mathematics", bio_en: "Leads technical design and overall direction.", bio_bn: "প্রযুক্তিগত নকশা ও সামগ্রিক দিকনির্দেশনার নেতৃত্ব দেন।", photo_url: "", links: {}, sort_order: 1 },
    { id: genId(), group_type: "team", name: "Parboti Rani Sarkar", title_en: "Lead Researcher, Lab & Environment", title_bn: "প্রধান গবেষক, ল্যাব ও পরিবেশ", department: "Environmental Science", bio_en: "Oversees lab research and environmental testing.", bio_bn: "ল্যাব গবেষণা ও পরিবেশগত পরীক্ষা তত্ত্বাবধান করেন।", photo_url: "", links: {}, sort_order: 2 },
    { id: genId(), group_type: "team", name: "Anika Tabassum Akhy", title_en: "Communication & Lab Associate", title_bn: "যোগাযোগ ও ল্যাব সহযোগী", department: "Communication", bio_en: "Bridges lab work and public communication.", bio_bn: "ল্যাবের কাজ ও জনসাধারণের যোগাযোগের সেতুবন্ধন তৈরি করেন।", photo_url: "", links: {}, sort_order: 3 },
    { id: genId(), group_type: "team", name: "Jannatul Mawoa Esha", title_en: "Finance & Budget Manager", title_bn: "অর্থ ও বাজেট ব্যবস্থাপক", department: "Finance", bio_en: "Manages budgeting and financial planning.", bio_bn: "বাজেট ও আর্থিক পরিকল্পনা পরিচালনা করেন।", photo_url: "", links: {}, sort_order: 4 },
    { id: genId(), group_type: "team", name: "Mrinmoy Mondal", title_en: "Marketing & Creative Lead", title_bn: "মার্কেটিং ও ক্রিয়েটিভ লিড", department: "Marketing", bio_en: "Leads storytelling, branding and outreach.", bio_bn: "গল্প বলা, ব্র্যান্ডিং ও প্রচারণার নেতৃত্ব দেন।", photo_url: "", links: {}, sort_order: 5 },
    { id: genId(), group_type: "team", name: "Samia Islam Jim", title_en: "Food Safety & Quality Testing Lead", title_bn: "খাদ্য নিরাপত্তা ও মান পরীক্ষা প্রধান", department: "Food Science", bio_en: "Leads quality and food-safety testing.", bio_bn: "মান ও খাদ্য-নিরাপত্তা পরীক্ষার নেতৃত্ব দেন।", photo_url: "", links: {}, sort_order: 6 },
  ];

  const testimonials: Testimonial[] = [
    { id: genId(), name: "Rahima Begum", role_en: "Pilot household, Khulna", role_bn: "পাইলট পরিবার, খুলনা", quote_en: "The water looks and tastes much cleaner now. (Sample feedback)", quote_bn: "পানি এখন অনেক পরিষ্কার দেখায় ও লাগে। (নমুনা মতামত)", avatar_url: "", is_sample: true, sort_order: 1 },
    { id: genId(), name: "Dr. Farhana Kabir", role_en: "Environmental scientist", role_bn: "পরিবেশ বিজ্ঞানী", quote_en: "A promising low-cost approach worth piloting further. (Sample feedback)", quote_bn: "আরও পরীক্ষা করার মতো একটি সম্ভাবনাময় সাশ্রয়ী পদ্ধতি। (নমুনা মতামত)", avatar_url: "", is_sample: true, sort_order: 2 },
    { id: genId(), name: "Jahangir Alam", role_en: "Local trader, Chuknagar", role_bn: "স্থানীয় ব্যবসায়ী, চুকনগর", quote_en: "Good to see our shell waste used for something useful. (Sample feedback)", quote_bn: "আমাদের খোলসের বর্জ্য কাজে লাগতে দেখে ভালো লাগছে। (নমুনা মতামত)", avatar_url: "", is_sample: true, sort_order: 3 },
  ];

  const faqs: Faq[] = [
    { id: genId(), question_en: "Does the filter remove salinity?", question_bn: "ফিল্টার কি লবণাক্ততা দূর করে?", answer_en: "No. The Shonjibon filter does not remove salinity. Pair it with rainwater harvesting in saline-prone areas.", answer_bn: "না। সঞ্জীবন ফিল্টার লবণাক্ততা দূর করে না। লবণাক্ত এলাকায় বৃষ্টির পানি সংগ্রহের সাথে এটি ব্যবহার করুন।", sort_order: 1 },
    { id: genId(), question_en: "Does it kill germs or bacteria?", question_bn: "এটি কি জীবাণু বা ব্যাকটেরিয়া মারে?", answer_en: "The filter is not designed for germ removal. Use SODIS solar disinfection or boiling alongside it.", answer_bn: "ফিল্টারটি জীবাণু দূর করার জন্য তৈরি নয়। এর সাথে সোডিস সৌর জীবাণুমুক্তকরণ বা ফুটানো ব্যবহার করুন।", sort_order: 2 },
    { id: genId(), question_en: "How often should the cartridge be replaced?", question_bn: "কার্তুজ কতদিন পরপর পরিবর্তন করতে হয়?", answer_en: "Roughly every two months for an average household (sample estimate, varies by usage).", answer_bn: "গড় পরিবারের জন্য প্রায় প্রতি দুই মাসে একবার (নমুনা অনুমান, ব্যবহার অনুযায়ী ভিন্ন হতে পারে)।", sort_order: 3 },
    { id: genId(), question_en: "Where do the shrimp shells come from?", question_bn: "চিংড়ির খোলস কোথা থেকে আসে?", answer_en: "We collect them from Chuknagar market and MU Sea Food processing plant.", answer_bn: "আমরা এগুলো চুকনগর বাজার ও এমইউ সি ফুড প্রক্রিয়াকরণ কারখানা থেকে সংগ্রহ করি।", sort_order: 4 },
    { id: genId(), question_en: "Is the shrimp-shell flour safe for people with allergies?", question_bn: "শেলফিশ অ্যালার্জি থাকলে কি গুঁড়া নিরাপদ?", answer_en: "No — Shonjibon Soyad contains shellfish and is not suitable for people with shellfish allergies.", answer_bn: "না — সঞ্জীবন সোয়াদে শেলফিশ রয়েছে এবং শেলফিশ অ্যালার্জি থাকলে এটি উপযুক্ত নয়।", sort_order: 5 },
  ];

  const partners: Partner[] = [
    { id: genId(), name: "BRAC Amra Notun Network", logo_url: "", url: "https://amranotun.com", sort_order: 1 },
    { id: genId(), name: "JUST Cohort 2026", logo_url: "", url: "", sort_order: 2 },
    { id: genId(), name: "MU Sea Food", logo_url: "", url: "", sort_order: 3 },
  ];

  const downloads: Download[] = [
    { id: genId(), title_en: "One-page project brief (sample)", title_bn: "এক পৃষ্ঠার প্রকল্প সংক্ষিপ্তসার (নমুনা)", file_url: "#", file_type: "pdf", sort_order: 1 },
    { id: genId(), title_en: "Lab testing summary (sample)", title_bn: "ল্যাব পরীক্ষার সারাংশ (নমুনা)", file_url: "#", file_type: "pdf", sort_order: 2 },
  ];

  const settings: Settings = {
    motto_en: "New life from waste",
    motto_bn: "বর্জ্য থেকে নতুন জীবন",
    hero_title_en: "A water filter made from shrimp shells",
    hero_title_bn: "চিংড়ির খোলস থেকে তৈরি পানি ফিল্টার",
    hero_subtitle_en: "A low-cost, electricity-free filter built with chitosan — helps reduce arsenic, heavy metals and turbidity.",
    hero_subtitle_bn: "কাইটোসান প্রযুক্তিতে তৈরি সাশ্রয়ী, বিদ্যুৎবিহীন ফিল্টার — আর্সেনিক, ভারী ধাতু ও ঘোলাত্ব কমাতে সাহায্য করে।",
    contact_phone: "01620485218",
    contact_email: "usamabenmahmud@gmail.com",
    contact: {
      phone: "01620485218",
      email: "usamabenmahmud@gmail.com",
      address: "Khulna, Bangladesh",
      hours: "",
      map_link: "",
      whatsapp_enabled: false,
    },
    contact_address_en: "Khulna, Bangladesh",
    contact_address_bn: "খুলনা, বাংলাদেশ",
    branding: {
      name_bn: "সঞ্জীবন",
      name_en: "Shonjibon",
      show_bangla_name: true,
      logo_mark_url: "",
      logo_full_url: "",
      logo_dark_url: "",
      logo_height: 40,
      use_mark_only: false,
    },
    shell_story: { image_url: "", use_illustration: true },
    social_facebook: "https://facebook.com",
    social_youtube: "https://youtube.com",
    social_linkedin: "https://linkedin.com",
    admin_password: "shonjibon2026",
    sections: {
      hero: true,
      impact: true,
      shellDiagram: true,
      products: true,
      circularEconomy: true,
      wasteRing: true,
      journey: true,
      community: true,
      articles: true,
      team: true,
      testimonials: true,
      newsletter: true,
    },
  };

  const product_categories: ProductCategory[] = [
    { id: "pc-water", slug: "water-filters", name_en: "Water filters", name_bn: "পানি ফিল্টার", sort_order: 1, is_published: true },
    { id: "pc-byproducts", slug: "shell-byproducts", name_en: "Shell by-products", name_bn: "খোলসের উপজাত", sort_order: 2, is_published: true },
  ];
  products[0].category_id = "pc-water";
  for (const product of products.slice(1)) product.category_id = "pc-byproducts";

  return {
    settings,
    products,
    product_categories,
    article_categories,
    articles,
    journey_milestones,
    research_items,
    test_results,
    impact_stats,
    community_visits,
    team_members,
    testimonials,
    faqs,
    partners,
    downloads,
    orders: [],
    contact_messages: [],
    subscribers: [],
    media: [],
    page_sections: makeDefaultPageSections(genId),
    shell_parts: makeDefaultShellParts(),
    nav_items: makeDefaultNavItems(genId),
    audit_log: [],
    order_seq: 0,
  };
}

// ---------------------------------------------------------------------------
// Persistence layer — try/catch around localStorage with in-memory fallback.
// ---------------------------------------------------------------------------

let memoryDb: DB | null = null;

function loadRaw(): DB | null {
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? (JSON.parse(raw) as DB) : null;
  } catch {
    return memoryDb;
  }
}

function saveRaw(db: DB) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    memoryDb = db;
  }
}

export function getDb(): DB {
  let db = loadRaw();
  if (!db) {
    db = buildSeed();
    saveRaw(db);
  }
  for (const result of db.test_results) {
    if (result.status === "sample") result.is_sample = true;
  }
  db.team_members = db.team_members.filter((member) => member.group_type === "team");
  db.product_categories ??= [
    { id: "pc-water", slug: "water-filters", name_en: "Water filters", name_bn: "পানি ফিল্টার", sort_order: 1, is_published: true },
    { id: "pc-byproducts", slug: "shell-byproducts", name_en: "Shell by-products", name_bn: "খোলসের উপজাত", sort_order: 2, is_published: true },
  ];
  db.settings.branding ??= {
    name_bn: "সঞ্জীবন",
    name_en: "Shonjibon",
    show_bangla_name: true,
    logo_mark_url: "",
    logo_full_url: "",
    logo_dark_url: "",
    logo_height: 40,
    use_mark_only: false,
  };
  db.settings.contact_email ||= "usamabenmahmud@gmail.com";
  db.settings.contact ??= {
    phone: db.settings.contact_phone,
    email: db.settings.contact_email,
    address: db.settings.contact_address_en,
    hours: "",
    map_link: "",
    whatsapp_enabled: false,
  };
  db.settings.shell_story ??= { image_url: "", use_illustration: true };
  for (const product of db.products) {
    product.stock_quantity ??= product.stock_status === "out_of_stock" ? 0 : 10;
    product.low_stock_threshold ??= 5;
    product.sku ??= product.slug.toUpperCase().replace(/[^A-Z0-9]+/g, "-");
    product.is_featured ??= product.is_flagship;
  }
  db.page_sections ??= makeDefaultPageSections(genId);
  db.shell_parts ??= makeDefaultShellParts();
  db.nav_items ??= makeDefaultNavItems(genId);
  memoryDb = db;
  return db;
}

export function setDb(db: DB) {
  memoryDb = db;
  saveRaw(db);
}

export function resetDb(): DB {
  const fresh = buildSeed();
  setDb(fresh);
  return fresh;
}

export function recordAudit(db: DB, action: string, table: string, recordId: string, before: unknown, after: unknown) {
  db.audit_log.unshift({
    id: genId(),
    actor: "admin (mock)",
    action,
    table_name: table,
    record_id: recordId,
    before,
    after,
    created_at: now(),
  });
  db.audit_log = db.audit_log.slice(0, 200);
}

export function makeOrderNo(db: DB): string {
  db.order_seq += 1;
  return nextOrderNo(db.order_seq);
}

export { genId, now, slugify };
export type { OrderItem };
