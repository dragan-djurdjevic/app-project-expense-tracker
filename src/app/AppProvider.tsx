// Spec: AR-001, AR-002, UI-080
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Settings } from "../core/domain/Settings";
import type { Container, RuntimeInfo, UseCases } from "./Container";

interface AppContextValue {
  useCases: UseCases;
  runtime: RuntimeInfo;
  /** Current settings (currency for display, default VAT rate). */
  settings: Settings;
  setSettings: (settings: Settings) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({
  container,
  initialSettings,
  children,
}: {
  container: Container;
  initialSettings: Settings;
  children: ReactNode;
}) {
  const [settings, setSettingsState] = useState(initialSettings);
  const setSettings = useCallback((next: Settings) => setSettingsState(next), []);
  const value = useMemo(
    () => ({ useCases: container.useCases, runtime: container.runtime, settings, setSettings }),
    [container, settings, setSettings],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) {
    throw new Error("useApp must be used inside <AppProvider>");
  }
  return value;
}
