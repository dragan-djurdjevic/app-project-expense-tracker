// Spec: UI-090, AR-010
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import type { Language } from "../../core/domain/Settings";
import en from "./en.json";
import srLatn from "./sr-Latn.json";

export const i18n = i18next.createInstance();

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, "sr-Latn": { translation: srLatn } },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  initAsync: false,
});

/** UI-090: switches all UI texts to the language from `settings.language`. */
export async function applyLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
}
