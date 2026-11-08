// Spec: DM-060
import type { VatRate } from "./VatRate";

export const CURRENCIES = ["EUR", "RSD", "USD", "CHF", "GBP"] as const;

export type Currency = (typeof CURRENCIES)[number];

export const LANGUAGES = ["en", "sr-Latn"] as const;

export type Language = (typeof LANGUAGES)[number];

export interface Settings {
  currency: Currency;
  defaultVatRate: VatRate;
  language: Language;
}

export const DEFAULT_SETTINGS: Settings = { currency: "EUR", defaultVatRate: 2000, language: "en" };

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

/** DM-060: `language` is one of `en`, `sr-Latn`. */
export function isLanguage(value: string): value is Language {
  return (LANGUAGES as readonly string[]).includes(value);
}
