// Spec: UI-001, UI-090
import { AppShell, Divider, NavLink, ScrollArea } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";
import { NAV_ITEMS, type NavItem } from "../../navigation";

function NavEntry({ item, active }: { item: NavItem; active: boolean }) {
  const { t } = useTranslation();
  return (
    <NavLink component={Link} to={item.route} label={t(item.labelKey)} active={active} data-testid={item.testId} />
  );
}

export default function AppShellLayout() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const isActive = (item: NavItem) => pathname === item.route || pathname.startsWith(`${item.route}/`);
  const section = (name: NavItem["section"]) =>
    NAV_ITEMS.filter((item) => item.section === name).map((item) => (
      <NavEntry key={item.route} item={item} active={isActive(item)} />
    ));

  return (
    <AppShell navbar={{ width: 260, breakpoint: 0 }} padding="lg">
      <AppShell.Navbar p="sm">
        <AppShell.Section grow component={ScrollArea}>
          {section("main")}
          <Divider my="sm" label={t("nav.analytics")} labelPosition="left" />
          {section("analytics")}
        </AppShell.Section>
        <AppShell.Section>
          <Divider my="sm" />
          {section("bottom")}
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
