// Spec: UI-032, UI-002, UI-090, DM-030
import { Badge, Group, Paper, SimpleGrid, Stack, Tabs, Text } from "@mantine/core";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { useApp } from "../../../app/AppProvider";
import type { ProjectDetails } from "../../../core/domain/Project";
import { ScreenTitle } from "../../components/ScreenTitle";
import { ProjectStatusBadge } from "../../components/StatusBadge";
import { formatDate } from "../../format/date";
import { formatMoney } from "../../format/money";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <div>{children}</div>
    </Stack>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <Paper withBorder p="md" radius="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text fw={700} size="lg">
        {value}
      </Text>
    </Paper>
  );
}

/** Project detail (route `/projects/:id`): header, summary cards, Contracts/Invoices tabs. */
export default function ProjectDetailScreen() {
  const { t } = useTranslation();
  const { id = "" } = useParams();
  const { useCases, settings } = useApp();
  const [project, setProject] = useState<ProjectDetails | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    void useCases.getProject(id).then((result) => {
      if (active && result.ok) setProject(result.value);
    });
    return () => {
      active = false;
    };
  }, [useCases, id]);

  if (project === undefined) return null;
  if (project === null) return <Text c="dimmed">{t("errors.notFound")}</Text>;

  const money = (value: number) => formatMoney(value, settings.currency);
  const { summary } = project;

  return (
    <>
      <Group gap="sm" align="center">
        <ScreenTitle>{project.name}</ScreenTitle>
        {project.archivedAt !== null && (
          <Badge color="gray" variant="light" mb="md">
            {t("common.archived")}
          </Badge>
        )}
      </Group>
      <Group gap="xl" mb="lg">
        <Field label={t("entity.project.investor")}>{project.investorName}</Field>
        <Field label={t("entity.project.status")}>
          <ProjectStatusBadge status={project.status} />
        </Field>
        <Field label={t("entity.project.deadline")}>{project.deadline ? formatDate(project.deadline) : "—"}</Field>
        <Field label={t("entity.project.budget")}>{project.budget === null ? "—" : money(project.budget)}</Field>
      </Group>
      <SimpleGrid cols={5} mb="lg">
        <Card label={t("entity.project.summary.contracted")} value={money(summary.contracted)} />
        <Card label={t("entity.project.summary.collected")} value={money(summary.collected)} />
        <Card label={t("entity.project.summary.contractedOut")} value={money(summary.contractedOut)} />
        <Card label={t("entity.project.summary.paidOut")} value={money(summary.paidOut)} />
        <Card label={t("entity.project.summary.net")} value={money(summary.net)} />
      </SimpleGrid>
      <Tabs defaultValue="contracts">
        <Tabs.List>
          <Tabs.Tab value="contracts">{t("nav.contracts")}</Tabs.Tab>
          <Tabs.Tab value="invoices">{t("nav.invoices")}</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="contracts" pt="md">
          <Text c="dimmed">{t("common.comingIn", { milestone: "M3" })}</Text>
        </Tabs.Panel>
        <Tabs.Panel value="invoices" pt="md">
          <Text c="dimmed">{t("common.comingIn", { milestone: "M4" })}</Text>
        </Tabs.Panel>
      </Tabs>
    </>
  );
}
