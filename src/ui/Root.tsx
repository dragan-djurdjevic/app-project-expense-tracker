// Spec: UI-001, AR-010, UI-090
import "dayjs/locale/sr";
import { MantineProvider } from "@mantine/core";
import { DatesProvider } from "@mantine/dates";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import { I18nextProvider, useTranslation } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { i18n } from "./i18n";

/** UI-090: `DatesProvider` locale follows the active language (`en` → `en`, `sr-Latn` → `sr`). */
function LocalizedDates({ children }: { children: ReactNode }) {
  const { i18n: active } = useTranslation();
  const locale = active.language === "sr-Latn" ? "sr" : "en";
  return <DatesProvider settings={{ locale }}>{children}</DatesProvider>;
}

/** Providers shared by the app and the startup error screen (light theme only). */
export function UiRoot({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <MantineProvider defaultColorScheme="light" forceColorScheme="light">
        <LocalizedDates>
          <ModalsProvider>
            <Notifications position="top-right" />
            <BrowserRouter>{children}</BrowserRouter>
          </ModalsProvider>
        </LocalizedDates>
      </MantineProvider>
    </I18nextProvider>
  );
}
