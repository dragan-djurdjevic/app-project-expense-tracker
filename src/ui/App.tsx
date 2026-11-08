// Spec: UI-001, UI-080, UI-010, UI-020, UI-030, UI-032, UI-040, UI-050, UI-061, UI-062, UI-063, UI-064, UI-065
import { Navigate, Route, Routes } from "react-router-dom";
import { NAV_ITEMS } from "./navigation";
import BudgetRealisationScreen from "./screens/Analytics/BudgetRealisationScreen";
import ContractedVsCollectedScreen from "./screens/Analytics/ContractedVsCollectedScreen";
import NetResultScreen from "./screens/Analytics/NetResultScreen";
import ProjectsPerYearScreen from "./screens/Analytics/ProjectsPerYearScreen";
import SubcontractorPaymentsScreen from "./screens/Analytics/SubcontractorPaymentsScreen";
import ContractsScreen from "./screens/Contracts/ContractsScreen";
import InvestorsScreen from "./screens/Investors/InvestorsScreen";
import InvoicesScreen from "./screens/Invoices/InvoicesScreen";
import PlaceholderScreen from "./screens/Placeholder/PlaceholderScreen";
import ProjectDetailScreen from "./screens/ProjectDetail/ProjectDetailScreen";
import ProjectsScreen from "./screens/Projects/ProjectsScreen";
import SettingsScreen from "./screens/Settings/SettingsScreen";
import AppShellLayout from "./screens/Shell/AppShellLayout";
import SubcontractorsScreen from "./screens/Subcontractors/SubcontractorsScreen";

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
        <Route path="/projects" element={<ProjectsScreen />} />
        <Route path="/projects/:id" element={<ProjectDetailScreen />} />
        <Route path="/contracts" element={<ContractsScreen />} />
        <Route path="/invoices" element={<InvoicesScreen />} />
        <Route path="/investors" element={<InvestorsScreen />} />
        <Route path="/subcontractors" element={<SubcontractorsScreen />} />
        <Route path="/analytics/contracted-vs-collected" element={<ContractedVsCollectedScreen />} />
        <Route path="/analytics/subcontractor-payments" element={<SubcontractorPaymentsScreen />} />
        <Route path="/analytics/projects-per-year" element={<ProjectsPerYearScreen />} />
        <Route path="/analytics/net-result" element={<NetResultScreen />} />
        <Route path="/analytics/budget-realisation" element={<BudgetRealisationScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Route>
    </Routes>
  );
}
