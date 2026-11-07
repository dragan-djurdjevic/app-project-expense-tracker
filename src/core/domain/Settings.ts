// Spec: DM-060
import type { VatRate } from "./VatRate";

export const CURRENCIES = ["EUR", "RSD", "USD", "CHF", "GBP"] as const;

export type Currency = (typeof CURRENCIES)[number];

export interface Settings {
  currency: Currency;
  defaultVatRate: VatRate;
}

export const DEFAULT_SETTINGS: Settings = { currency: "EUR", defaultVatRate: 2000 };

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}
