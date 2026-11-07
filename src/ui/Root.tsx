// Spec: UI-001, AR-010, UI-090
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import type { ReactNode } from "react";
import { I18nextProvider } from "react-i18next";
import { BrowserRouter } from "react-router-dom";
import { i18n } from "./i18n";

/** Providers shared by the app and the startup error screen (light theme only). */
export function UiRoot({ children }: { children: ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <MantineProvider defaultColorScheme="light" forceColorScheme="light">
        <ModalsProvider>
          <Notifications position="top-right" />
          <BrowserRouter>{children}</BrowserRouter>
        </ModalsProvider>
      </MantineProvider>
    </I18nextProvider>
  );
}
