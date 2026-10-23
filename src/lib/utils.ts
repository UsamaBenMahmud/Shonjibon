import type { Lang } from "@/lib/types";

/** Pick the bilingual field for the current language, falling back gracefully. */
export function t2(obj: object | null | undefined, base: string, lang: Lang): string {
  if (!obj) return "";
  const record = obj as Record<string, unknown>;
  const value = record[`${base}_${lang}`] ?? record[`${base}_${lang === "bn" ? "en" : "bn"}`] ?? "";
  return typeof value === "string" ? value : "";
}

export function formatCurrency(amount: number, currency = "BDT", lang: Lang = "bn"): string {
  const digits = lang === "bn" ? toBanglaDigits(String(Math.round(amount))) : String(Math.round(amount));
  const symbol = currency === "BDT" ? "৳" : currency;
  return `${symbol}${digits}`;
}

const banglaDigitMap: Record<string, string> = {
  "0": "০",
  "1": "১",
  "2": "২",
  "3": "৩",
  "4": "৪",
  "5": "৫",
  "6": "৬",
  "7": "৭",
  "8": "৮",
  "9": "৯",
};

export function toBanglaDigits(value: string): string {
  return value.replace(/[0-9]/g, (d) => banglaDigitMap[d] ?? d);
}

export function formatBdPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^88/, "");
  return digits.length === 11 && digits.startsWith("01")
    ? `${digits.slice(0, 5)} ${digits.slice(5)}`
    : phone;
}

export function bdPhoneHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "tel:+8801620485218";
  if (digits.startsWith("880")) return `tel:+${digits}`;
  return `tel:+88${digits.replace(/^0/, "")}`;
}

export function formatNumber(value: number, lang: Lang): string {
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return lang === "bn" ? toBanglaDigits(rounded) : rounded;
}

export function formatDate(iso: string | null | undefined, lang: Lang): string {
  if (!iso) return "";
  const date = new Date(iso);
  const formatted = date.toLocaleDateString(lang === "bn" ? "bn-BD" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return formatted;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function readingTimeMinutes(html: string, lang: Lang): string {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 180));
  return lang === "bn" ? `${toBanglaDigits(String(minutes))} মিনিট পড়া` : `${minutes} min read`;
}

export function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nextOrderNo(seq: number): string {
  return `SJ-2026-${String(seq).padStart(4, "0")}`;
}

export function sortByOrder<T extends { sort_order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.sort_order - b.sort_order);
}

export function classNamesIf(condition: boolean, cls: string): string {
  return condition ? cls : "";
}
