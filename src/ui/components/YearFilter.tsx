// Spec: UI-060, AN-000
import { Select } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../app/AppProvider";
import type { YearSelection } from "../../core/domain/Analytics";
import { useAsyncList } from "./useAsyncList";

const ALL_YEARS = "ALL";

/**
 * UI-060: year selection from `availableYears()`; default = current calendar year if present, else the latest year.
 * `null` until the years are loaded.
 */
export function useYearSelection(): {
  years: number[];
  year: YearSelection | null;
  setYear: (year: YearSelection) => void;
} {
  const { useCases } = useApp();
  const years = useAsyncList(() => useCases.getAvailableYears(), [useCases]);
  const [year, setYear] = useState<YearSelection | null>(null);
  useEffect(() => {
    if (year === null && years.length > 0) {
      const current = new Date().getFullYear();
      setYear(years.includes(current) ? current : years[0]);
    }
  }, [years, year]);
  return { years, year, setYear };
}

/** Year selector (`filter-year`); "All years" only when `allowAll` (UI-061, UI-062, UI-064). */
export function YearFilter({
  years,
  value,
  onChange,
  allowAll,
}: {
  years: number[];
  value: YearSelection | null;
  onChange: (year: YearSelection) => void;
  allowAll: boolean;
}) {
  const { t } = useTranslation();
  return (
    <Select
      label={t("analytics.year")}
      data={[
        ...(allowAll ? [{ value: ALL_YEARS, label: t("common.allYears") }] : []),
        ...years.map((y) => ({ value: String(y), label: String(y) })),
      ]}
      value={value === null ? null : String(value)}
      onChange={(next) => {
        if (next !== null) onChange(next === ALL_YEARS ? "ALL" : Number(next));
      }}
      allowDeselect={false}
      w={160}
      data-testid="filter-year"
    />
  );
}
