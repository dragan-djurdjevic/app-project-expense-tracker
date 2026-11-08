// Spec: UI-001, UI-003, UI-081, UI-090
import { Alert, AppShell, Button, Divider, Group, NavLink, ScrollArea, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useApp } from "../../../app/AppProvider";
import type { Profile } from "../../../app/profile";
import { SwitchProfileDialog } from "../../components/SwitchProfileDialog";
import { NAV_ITEMS, type NavItem } from "../../navigation";

/** UI-003: non-dismissable banner shown on every screen while the profile is `demo`. */
function DemoBanner() {
  const { t } = useTranslation();
  const [target, setTarget] = useState<Profile | null>(null);
  return (
    <>
      <Alert color="orange" mb="md" data-testid="demo-banner">
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">{t("demo.banner")}</Text>
          <Button size="xs" color="orange" onClick={() => setTarget("live")} data-testid="btn-banner-switch-live">
            {t("demo.switchToLive")}
          </Button>
        </Group>
      </Alert>
      <SwitchProfileDialog target={target} onCancel={() => setTarget(null)} />
    </>
  );
}

function NavEntry({ item, active }: { item: NavItem; active: boolean }) {
  const { t } = useTranslation();
  return (
    <NavLink component={Link} to={item.route} label={t(item.labelKey)} active={active} data-testid={item.testId} />
  );
}

export default function AppShellLayout() {
  const { t } = useTranslation();
  const { runtime } = useApp();
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
        {runtime.profile === "demo" && <DemoBanner />}
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
