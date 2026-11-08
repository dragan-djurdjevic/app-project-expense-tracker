// Spec: UI-002, DM-060
import type { Language } from "../../core/domain/Settings";

/** UI-002: formatting locale of a language (`en` → `en-GB`, `sr-Latn` → `sr-Latn-RS`). */
export function formatLocale(language: Language): string {
  return language === "sr-Latn" ? "sr-Latn-RS" : "en-GB";
}

/** UI-002: decimal separator of the language (`.` in en, `,` in sr-Latn) applied to a `.`-formatted number. */
export function localizeDecimal(text: string, language: Language): string {
  return language === "sr-Latn" ? text.replace(".", ",") : text;
}

/** UI-002: text sorting with `localeCompare(<locale>, { sensitivity: "base", numeric: true })`. */
export function compareText(a: string, b: string, language: Language = "en"): number {
  return a.localeCompare(b, formatLocale(language), { sensitivity: "base", numeric: true });
}
