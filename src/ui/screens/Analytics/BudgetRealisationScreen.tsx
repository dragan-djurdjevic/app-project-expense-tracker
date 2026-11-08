// Spec: UI-065, AN-5, AN-000, UI-090
import { Group, MultiSelect, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { BudgetRealisationReport } from "../../../core/domain/Analytics";
import type { ProjectStatus } from "../../../core/domain/Project";
import { PROJECT_STATUS_OPTIONS } from "../../../core/usecases/project/createProject";
import { ScreenTitle } from "../../components/ScreenTitle";
import { ProjectStatusBadge } from "../../components/StatusBadge";
import { AnalyticsTable, MoneyText, PercentText, ProjectCell } from "./AnalyticsParts";
import { RealisationBar } from "../../components/RealisationBar";

/** UI-065 Budget realisation (AN-5): no year selector, status multi-select filter (default all), net only. */
export default function BudgetRealisationScreen() {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const [statuses, setStatuses] = useState<string[]>([]);
  const [report, setReport] = useState<BudgetRealisationReport | null>(null);

  useEffect(() => {
    let active = true;
    void useCases.getBudgetRealisation(statuses as ProjectStatus[]).then((result) => {
      if (active && result.ok) setReport(result.value);
    });
    return () => {
      active = false;
    };
  }, [useCases, statuses]);

  return (
    <>
      <ScreenTitle>{t("nav.analyticsBudget")}</ScreenTitle>
      <Group align="flex-end" mb="md">
        <MultiSelect
          label={t("analytics.status")}
          placeholder={t("common.all")}
          data={PROJECT_STATUS_OPTIONS.map((status) => ({ value: status, label: t(`enum.projectStatus.${status}`) }))}
          value={statuses}
          onChange={setStatuses}
          clearable
          miw={240}
          data-testid="filter-status"
        />
      </Group>
      {report && (
        <AnalyticsTable
          headers={[
            t("analytics.project"),
            t("analytics.investor"),
            t("analytics.status"),
            t("analytics.budget"),
            t("analytics.contracted"),
            t("analytics.contractedPercentOfBudget"),
            t("analytics.invoiced"),
            t("analytics.collected"),
            t("analytics.realisationPercentOfBudget"),
            t("analytics.realisationPercentOfContracted"),
            t("analytics.remaining"),
          ]}
          footer={[
            "",
            "",
            "",
            <MoneyText key="b" value={report.footer.budget} />,
            <MoneyText key="c" value={report.footer.contracted} />,
            <PercentText key="cb" value={report.footer.contractedPercentOfBudget} />,
            <MoneyText key="i" value={report.footer.invoiced} />,
            <MoneyText key="k" value={report.footer.collected} />,
            <PercentText key="rb" value={report.footer.realisationPercentOfBudget} />,
            <PercentText key="rc" value={report.footer.realisationPercentOfContracted} />,
            <MoneyText key="r" value={report.footer.remaining} />,
          ]}
        >
          {report.rows.map((row) => (
            <Table.Tr key={row.projectId} data-testid={`row-${row.projectId}`}>
              <Table.Td>
                <ProjectCell id={row.projectId} name={row.projectName} archived={row.projectArchived} />
              </Table.Td>
              <Table.Td>{row.investorName}</Table.Td>
              <Table.Td>
                <ProjectStatusBadge status={row.status} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.budget} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.contracted} />
              </Table.Td>
              <Table.Td>
                <PercentText value={row.contractedPercentOfBudget} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.invoiced} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.collected} />
              </Table.Td>
              <Table.Td>
                <RealisationBar value={row.realisationPercentOfBudget} testId={`bar-realisation-${row.projectId}`} />
              </Table.Td>
              <Table.Td>
                <PercentText value={row.realisationPercentOfContracted} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.remaining} />
              </Table.Td>
            </Table.Tr>
          ))}
        </AnalyticsTable>
      )}
    </>
  );
}
