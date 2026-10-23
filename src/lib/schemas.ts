import { z } from "zod";
import type { DB } from "@/lib/mockDb";

export const checkoutSchema = z.object({
  customer_name: z.string().trim().min(2, "নাম/Name is required"),
  phone: z
    .string()
    .trim()
    .regex(/^01[3-9]\d{8}$/, "বাংলাদেশি মোবাইল নম্বর দিন / Enter a valid Bangladesh mobile number"),
  email: z.union([z.literal(""), z.string().email("সঠিক ইমেইল দিন / Enter a valid email")]).optional(),
  address: z.string().trim().min(5, "ঠিকানা দিন / Address is required"),
  district: z.string().trim().min(2, "জেলা দিন / District is required"),
  note: z.string().optional(),
  payment_method: z.enum(["cash_on_delivery", "bank_transfer", "mobile_money", "sslcommerz"]),
  termsAccepted: z.literal(true, "অর্ডার করতে শর্তাবলীতে সম্মতি দিন / Agree to the Terms and Refund Policy"),
  // honeypot - must stay empty
  company: z.string().max(0).optional(),
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "নাম/Name is required"),
  email: z.string().email("সঠিক ইমেইল দিন / Enter a valid email"),
  phone: z.string().optional(),
  subject: z.string().trim().min(2, "বিষয় দিন / Subject is required"),
  message: z.string().trim().min(10, "অন্তত ১০ অক্ষরের বার্তা দিন / Message must be at least 10 characters"),
  company: z.string().max(0).optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const newsletterSchema = z.object({
  email: z.string().email("সঠিক ইমেইল দিন / Enter a valid email"),
  company: z.string().max(0, "অনুরোধটি যাচাই করা যায়নি / Submission could not be verified").optional(),
});
export type NewsletterInput = z.infer<typeof newsletterSchema>;

export const loginSchema = z.object({
  password: z.string().min(4, "পাসওয়ার্ড দিন / Enter a password"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const emailLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type EmailLoginInput = z.infer<typeof emailLoginSchema>;

export const accountSignupSchema = z.object({
  full_name: z.string().trim().min(2, "নাম কমপক্ষে ২ অক্ষর হতে হবে / Name must be at least 2 characters"),
  email: z.string().trim().email("সঠিক ইমেইল দিন / Enter a valid email"),
  password: z.string().min(8, "পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে / Password must be at least 8 characters"),
});

export const accountLoginSchema = z.object({
  email: z.string().trim().email("সঠিক ইমেইল দিন / Enter a valid email"),
  password: z.string().min(8, "পাসওয়ার্ড দিন / Enter your password"),
});

export const accountAddressSchema = z.object({
  label: z.string().trim().min(1, "ঠিকানার নাম দিন / Add an address label").max(40),
  recipient_name: z.string().trim().min(2, "নাম দিন / Enter a recipient name").max(120),
  phone: z.string().trim().regex(/^01[3-9]\d{8}$/, "বাংলাদেশি মোবাইল নম্বর দিন / Enter a valid Bangladesh mobile number"),
  address: z.string().trim().min(5, "সম্পূর্ণ ঠিকানা দিন / Enter a complete address").max(500),
  district: z.string().trim().min(2, "জেলা দিন / Enter a district").max(100),
});

export const productAdminSchema = z.object({
  name_en: z.string().trim().min(2, "ইংরেজি নাম দিন / Enter the English name"),
  name_bn: z.string().trim().min(2, "বাংলা নাম দিন / Enter the Bangla name"),
  slug: z.string().trim().min(1, "স্লাগ দিন / Enter a slug"),
  price: z.number().finite().min(0, "সঠিক মূল্য দিন / Enter a valid price"),
  sale_price: z.number().finite().min(0, "সঠিক বিক্রয়মূল্য দিন / Enter a valid sale price").nullable().optional(),
  sku: z.string().max(100).optional(),
  stock_quantity: z.number().int().min(0).optional(),
  low_stock_threshold: z.number().int().min(0).optional(),
  stock_status: z.enum(["in_stock", "preorder", "out_of_stock", "coming_soon"]),
  images: z.array(z.object({
    url: z.string().trim().min(1, "ছবির URL দিন / Add an image URL"),
    alt_en: z.string(),
    alt_bn: z.string(),
  })),
  specs: z.array(z.object({
    label_en: z.string().trim().min(1, "ইংরেজি বৈশিষ্ট্যের নাম দিন / Enter the English specification label"),
    label_bn: z.string().trim().min(1, "বাংলা বৈশিষ্ট্যের নাম দিন / Enter the Bangla specification label"),
    value_en: z.string(),
    value_bn: z.string(),
  })),
  benefits: z.array(z.object({
    title_en: z.string().trim().min(1, "ইংরেজি সুবিধার শিরোনাম দিন / Enter the English benefit title"),
    title_bn: z.string().trim().min(1, "বাংলা সুবিধার শিরোনাম দিন / Enter the Bangla benefit title"),
    body_en: z.string(),
    body_bn: z.string(),
  })),
  process_steps: z.array(z.object({
    title_en: z.string().trim().min(1, "ইংরেজি ধাপের শিরোনাম দিন / Enter the English step title"),
    title_bn: z.string().trim().min(1, "বাংলা ধাপের শিরোনাম দিন / Enter the Bangla step title"),
    body_en: z.string(),
    body_bn: z.string(),
  })),
  company: z.string().max(0, "অনুরোধটি যাচাই করা যায়নি / Submission could not be verified").optional(),
}).superRefine((product, context) => {
  if (product.sale_price != null && product.sale_price >= product.price) {
    context.addIssue({
      code: "custom",
      path: ["sale_price"],
      message: "বিক্রয়মূল্য মূল্যের চেয়ে কম হতে হবে / Sale price must be lower than the regular price",
    });
  }
});

export const articleAdminSchema = z.object({
  title_en: z.string().trim().min(2, "ইংরেজি শিরোনাম দিন / Enter the English title"),
  title_bn: z.string().trim().min(2, "বাংলা শিরোনাম দিন / Enter the Bangla title"),
  slug: z.string().trim().min(1, "স্লাগ দিন / Enter a slug"),
  company: z.string().max(0, "অনুরোধটি যাচাই করা যায়নি / Submission could not be verified").optional(),
});

export const settingsSchema = z.object({
  contact_email: z.union([
    z.literal(""),
    z.string().email("সঠিক ইমেইল দিন / Enter a valid email"),
  ]),
  social_facebook: z.union([z.literal(""), z.string().url("সঠিক URL দিন / Enter a valid URL")]),
  social_youtube: z.union([z.literal(""), z.string().url("সঠিক URL দিন / Enter a valid URL")]),
  social_linkedin: z.union([z.literal(""), z.string().url("সঠিক URL দিন / Enter a valid URL")]),
  contact: z.object({
    phone: z.string().max(30),
    email: z.union([z.literal(""), z.string().email("সঠিক ইমেইল দিন / Enter a valid email")]),
    address: z.string().max(500),
    hours: z.string().max(300),
    map_link: z.union([z.literal(""), z.string().url("সঠিক URL দিন / Enter a valid URL")]),
    whatsapp_enabled: z.boolean(),
  }).optional(),
  branding: z.object({
    name_bn: z.string().trim().min(1, "বাংলা ব্র্যান্ড নাম দিন / Enter the Bangla brand name"),
    name_en: z.string().trim().min(1, "ইংরেজি ব্র্যান্ড নাম দিন / Enter the English brand name"),
    show_bangla_name: z.boolean(),
    logo_mark_url: z.string().max(2048),
    logo_full_url: z.string().max(2048),
    logo_dark_url: z.string().max(2048),
    logo_height: z.number().int().min(28).max(64),
    use_mark_only: z.boolean().optional(),
  }).optional(),
  shell_story: z.object({
    image_url: z.string().max(2048),
    use_illustration: z.boolean(),
  }).optional(),
});

export const mediaUploadSchema = z.object({
  file: z.custom<File>((value): value is File => typeof File !== "undefined" && value instanceof File),
  alt_en: z.string().max(500, "Alt text is too long"),
  alt_bn: z.string().max(500, "Alt text is too long"),
}).superRefine(({ file }, context) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
  if (!allowedTypes.includes(file.type)) {
    context.addIssue({ code: "custom", path: ["file"], message: "অসমর্থিত ফাইল / Unsupported file type" });
  }
  if (file.size > 5 * 1024 * 1024) {
    context.addIssue({ code: "custom", path: ["file"], message: "ফাইল ৫MB-এর কম হতে হবে / File must be under 5MB" });
  }
});

export const mediaMetadataSchema = z.object({
  alt_en: z.string().max(500, "Alt text is too long"),
  alt_bn: z.string().max(500, "Alt text is too long"),
});

export const adminUserCreateSchema = z.object({
  full_name: z.string().trim().min(2, "নাম দিন / Enter a name"),
  email: z.string().email("সঠিক ইমেইল দিন / Enter a valid email"),
  role: z.enum(["editor", "super_admin"]),
  company: z.string().max(0, "অনুরোধটি যাচাই করা যায়নি / Submission could not be verified").optional(),
});

export const adminUserEditSchema = z.object({
  full_name: z.string().trim().min(2, "নাম দিন / Enter a name"),
  role: z.enum(["editor", "super_admin"]),
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const backupSchema = z.custom<DB>((value): value is DB => {
  if (!isRecord(value)) return false;
  const settings = value.settings;
  if (!isRecord(settings)) return false;
  const listKeys = [
    "products", "article_categories", "articles", "journey_milestones", "research_items", "shell_parts",
    "test_results", "impact_stats", "community_visits", "team_members", "testimonials", "faqs",
    "partners", "downloads", "orders", "contact_messages", "subscribers", "media", "audit_log",
  ];
  if (!listKeys.every((key) => Array.isArray(value[key]) && (value[key] as unknown[]).every(isRecord))) return false;
  if (!Number.isInteger(value.order_seq) || (value.order_seq as number) < 0) return false;

  const requiredSettings = [
    "motto_en", "motto_bn", "hero_title_en", "hero_title_bn", "hero_subtitle_en", "hero_subtitle_bn",
    "contact_phone", "contact_email", "contact_address_en", "contact_address_bn", "social_facebook",
    "social_youtube", "social_linkedin", "admin_password",
  ];
  if (!requiredSettings.every((key) => typeof settings[key] === "string")) return false;
  const sections = settings.sections;
  if (!isRecord(sections)) return false;
  return Object.values(sections).every((enabled) => typeof enabled === "boolean");
}, { message: "Backup structure is invalid" });
