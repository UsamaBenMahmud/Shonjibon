import english from "@/locales/en.json";
import bengali from "@/locales/bn.json";
import type { NavItem, PageSection } from "@/lib/types";

interface LocalizedSection {
  title: string;
  body: string;
}

interface LocalizedPage {
  items: LocalizedSection[];
}

type PageCollection = Record<"coastal" | "concerns" | "health", LocalizedPage>;

export function makeDefaultPageSections(createId: () => string): PageSection[] {
  const enPages = english.pages as PageCollection;
  const bnPages = bengali.pages as PageCollection;
  return (["coastal", "concerns", "health"] as const).flatMap((pageKey) =>
    enPages[pageKey].items.map((item, index) => ({
      id: createId(),
      page_key: pageKey,
      type: "cards",
      title_en: item.title,
      title_bn: bnPages[pageKey].items[index].title,
      body_en: item.body,
      body_bn: bnPages[pageKey].items[index].body,
      image: "",
      icon: "",
      source_name: "",
      source_url: "",
      is_sample: false,
      sort_order: index + 1,
      is_visible: true,
    })),
  );
}

export function makeDefaultNavItems(createId: () => string): NavItem[] {
  const rows: Omit<NavItem, "id">[] = [
    { parent_id: null, label_en: "Home", label_bn: "হোম", path: "/", group_key: "", description_en: "Return to the Shonjibon homepage.", description_bn: "সঞ্জীবন হোমপেজে ফিরে যান।", is_visible: true, sort_order: 1 },
    { parent_id: null, label_en: "Shop", label_bn: "দোকান", path: "/products", group_key: "shop", description_en: "Explore filters and shell-based products.", description_bn: "ফিল্টার ও খোলস-ভিত্তিক পণ্য দেখুন।", is_visible: true, sort_order: 2 },
    { parent_id: null, label_en: "All Products", label_bn: "সকল পণ্য", path: "/products", group_key: "shop", description_en: "Browse every available product.", description_bn: "সব পণ্য দেখুন।", is_visible: true, sort_order: 3 },
    { parent_id: null, label_en: "Our Concerns", label_bn: "আমাদের উদ্বেগ", path: "/coastal-problem", group_key: "concerns", description_en: "Learn about the challenges facing coastal communities.", description_bn: "উপকূলীয় এলাকার চ্যালেঞ্জ সম্পর্কে জানুন।", is_visible: true, sort_order: 4 },
    { parent_id: null, label_en: "Coastal Area Problem", label_bn: "উপকূলীয় এলাকার সমস্যা", path: "/coastal-problem", group_key: "concerns", description_en: "Water and environmental challenges in coastal Bangladesh.", description_bn: "উপকূলীয় বাংলাদেশের পানি ও পরিবেশগত চ্যালেঞ্জ।", is_visible: true, sort_order: 5 },
    { parent_id: null, label_en: "Our Concerning Issues", label_bn: "আমাদের উদ্বেগের বিষয়", path: "/concerns", group_key: "concerns", description_en: "Explore the issues our project addresses.", description_bn: "আমাদের প্রকল্পের লক্ষ্য বিষয়গুলো দেখুন।", is_visible: true, sort_order: 6 },
    { parent_id: null, label_en: "Health And Disease Topics", label_bn: "স্বাস্থ্য ও রোগ বিষয়", path: "/health", group_key: "concerns", description_en: "Read about water-related health concerns.", description_bn: "পানিসংশ্লিষ্ট স্বাস্থ্যঝুঁকি জানুন।", is_visible: true, sort_order: 7 },
    { parent_id: null, label_en: "Our Work", label_bn: "আমাদের কাজ", path: "/research", group_key: "work", description_en: "Discover our research, process, and community work.", description_bn: "গবেষণা, প্রক্রিয়া ও কমিউনিটির কাজ দেখুন।", is_visible: true, sort_order: 8 },
    { parent_id: null, label_en: "Research", label_bn: "গবেষণা", path: "/research", group_key: "work", description_en: "Explore our methods and findings.", description_bn: "আমাদের পদ্ধতি ও ফলাফল দেখুন।", is_visible: true, sort_order: 9 },
    { parent_id: null, label_en: "The Shell Story", label_bn: "খোলসের গল্প", path: "/shell", group_key: "work", description_en: "See how shrimp shells become useful products.", description_bn: "চিংড়ির খোলস থেকে কীভাবে পণ্য তৈরি হয় দেখুন।", is_visible: true, sort_order: 10 },
    { parent_id: null, label_en: "Lab Test Results", label_bn: "ল্যাব পরীক্ষার ফলাফল", path: "/lab-results", group_key: "work", description_en: "Review available testing and verification.", description_bn: "পরীক্ষা ও যাচাইয়ের তথ্য দেখুন।", is_visible: true, sort_order: 11 },
    { parent_id: null, label_en: "Our Journey", label_bn: "আমাদের যাত্রা", path: "/about", group_key: "work", description_en: "Follow the project from idea to pilot.", description_bn: "ধারণা থেকে পাইলট পর্যন্ত যাত্রা দেখুন।", is_visible: true, sort_order: 12 },
    { parent_id: null, label_en: "Picture Gallery", label_bn: "ছবির গ্যালারি", path: "/gallery", group_key: "work", description_en: "View moments from the project and community.", description_bn: "প্রকল্প ও কমিউনিটির মুহূর্ত দেখুন।", is_visible: true, sort_order: 13 },
    { parent_id: null, label_en: "News", label_bn: "সংবাদ", path: "/news", group_key: "news", description_en: "Read the latest news and awareness stories.", description_bn: "সাম্প্রতিক সংবাদ ও সচেতনতামূলক লেখা পড়ুন।", is_visible: true, sort_order: 14 },
    { parent_id: null, label_en: "News And Awareness", label_bn: "সংবাদ ও সচেতনতা", path: "/news", group_key: "news", description_en: "Read the latest news and awareness stories.", description_bn: "সাম্প্রতিক সংবাদ ও সচেতনতামূলক লেখা পড়ুন।", is_visible: true, sort_order: 15 },
    { parent_id: null, label_en: "About", label_bn: "আমাদের সম্পর্কে", path: "/about", group_key: "about", description_en: "Meet the people and purpose behind Shonjibon.", description_bn: "সঞ্জীবনের মানুষ ও উদ্দেশ্য সম্পর্কে জানুন।", is_visible: true, sort_order: 16 },
    { parent_id: null, label_en: "About Us", label_bn: "আমাদের সম্পর্কে", path: "/about", group_key: "about", description_en: "Learn about our mission and vision.", description_bn: "আমাদের লক্ষ্য ও দৃষ্টিভঙ্গি জানুন।", is_visible: true, sort_order: 17 },
    { parent_id: null, label_en: "Our Team", label_bn: "আমাদের দল", path: "/team", group_key: "about", description_en: "Meet the six core teammates.", description_bn: "ছয়জন মূল সদস্যের সঙ্গে পরিচিত হন।", is_visible: true, sort_order: 18 },
    { parent_id: null, label_en: "FAQ", label_bn: "প্রশ্নোত্তর", path: "/faq", group_key: "about", description_en: "Find answers to common questions.", description_bn: "সাধারণ প্রশ্নের উত্তর খুঁজুন।", is_visible: true, sort_order: 19 },
  ];
  return rows.map((row) => ({ ...row, id: createId() }));
}
