// Spec: UI-001, UI-010, UI-020, UI-030
export interface NavItem {
  /** i18n key of the sidebar label and screen title. */
  labelKey: string;
  route: string;
  testId: string;
  /** Milestone that implements the screen; until then a placeholder is shown. null = implemented. */
  placeholderMilestone: string | null;
  section: "main" | "analytics" | "bottom";
}

/** Sidebar items in their fixed order (UI-001). */
export const NAV_ITEMS: readonly NavItem[] = [
  { labelKey: "nav.projects", route: "/projects", testId: "nav-projects", placeholderMilestone: null, section: "main" },
  {
    labelKey: "nav.contracts",
    route: "/contracts",
    testId: "nav-contracts",
    placeholderMilestone: "M3",
    section: "main",
  },
  { labelKey: "nav.invoices", route: "/invoices", testId: "nav-invoices", placeholderMilestone: "M4", section: "main" },
  {
    labelKey: "nav.investors",
    route: "/investors",
    testId: "nav-investors",
    placeholderMilestone: null,
    section: "main",
  },
  {
    labelKey: "nav.subcontractors",
    route: "/subcontractors",
    testId: "nav-subcontractors",
    placeholderMilestone: null,
    section: "main",
  },
  {
    labelKey: "nav.analyticsContracted",
    route: "/analytics/contracted-vs-collected",
    testId: "nav-analytics-contracted",
    placeholderMilestone: "M5",
    section: "analytics",
  },
  {
    labelKey: "nav.analyticsSubcontractors",
    route: "/analytics/subcontractor-payments",
    testId: "nav-analytics-subcontractors",
    placeholderMilestone: "M5",
    section: "analytics",
  },
  {
    labelKey: "nav.analyticsProjects",
    route: "/analytics/projects-per-year",
    testId: "nav-analytics-projects",
    placeholderMilestone: "M5",
    section: "analytics",
  },
  {
    labelKey: "nav.analyticsNet",
    route: "/analytics/net-result",
    testId: "nav-analytics-net",
    placeholderMilestone: "M5",
    section: "analytics",
  },
  {
    labelKey: "nav.analyticsBudget",
    route: "/analytics/budget-realisation",
    testId: "nav-analytics-budget",
    placeholderMilestone: "M5",
    section: "analytics",
  },
  {
    labelKey: "nav.settings",
    route: "/settings",
    testId: "nav-settings",
    placeholderMilestone: null,
    section: "bottom",
  },
];
