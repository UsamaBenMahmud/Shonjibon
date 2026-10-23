import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";
import bn from "@/locales/bn.json";

export const LANG_STORAGE_KEY = "shonjibon.lang";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      bn: { translation: bn },
    },
    fallbackLng: "bn",
    supportedLngs: ["bn", "en"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ["localStorage"],
    },
    interpolation: { escapeValue: false },
  });

function applyDocumentLang(lng: string) {
  document.documentElement.lang = lng;
  document.body.classList.toggle("font-bn", lng === "bn");
}

applyDocumentLang(i18n.resolvedLanguage || "bn");
i18n.on("languageChanged", applyDocumentLang);

export default i18n;
