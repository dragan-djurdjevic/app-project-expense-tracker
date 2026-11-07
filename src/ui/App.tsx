// Spec: UI-001, UI-080
import { Navigate, Route, Routes } from "react-router-dom";
import { NAV_ITEMS } from "./navigation";
import PlaceholderScreen from "./screens/Placeholder/PlaceholderScreen";
import SettingsScreen from "./screens/Settings/SettingsScreen";
import AppShellLayout from "./screens/Shell/AppShellLayout";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShellLayout />}>
        <Route index element={<Navigate to="/projects" replace />} />
        {NAV_ITEMS.map((item) =>
          item.placeholderMilestone ? (
            <Route
              key={item.route}
              path={item.route}
              element={<PlaceholderScreen titleKey={item.labelKey} milestone={item.placeholderMilestone} />}
            />
          ) : null,
        )}
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
    </Routes>
  );
}
