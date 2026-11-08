// Spec: UI-063, UI-060, AN-3, AN-000, UI-090
import { Group, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { ProjectsInYearReport } from "../../../core/domain/Analytics";
import { ScreenTitle } from "../../components/ScreenTitle";
import { ProjectStatusBadge } from "../../components/StatusBadge";
import { useYearSelection, YearFilter } from "../../components/YearFilter";
import { formatDate } from "../../format/date";
import { AnalyticsTable, MoneyText, ProjectCell } from "./AnalyticsParts";

/** UI-063 Projects per year (AN-3); "All years" is not offered. */
export default function ProjectsPerYearScreen() {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const { years, year, setYear } = useYearSelection();
  const [report, setReport] = useState<ProjectsInYearReport | null>(null);

  useEffect(() => {
    if (year === null || year === "ALL") return;
    let active = true;
    void useCases.getProjectsInYear(year).then((result) => {
      if (active && result.ok) setReport(result.value);
    });
    return () => {
      active = false;
    };
  }, [useCases, year]);

  return (
    <>
      <ScreenTitle>{t("nav.analyticsProjects")}</ScreenTitle>
      <Group align="flex-end" mb="md">
        <YearFilter years={years} value={year} onChange={setYear} allowAll={false} />
      </Group>
      {report && (
        <AnalyticsTable
          headers={[
            t("analytics.project"),
            t("analytics.investor"),
            t("analytics.status"),
            t("analytics.deadline"),
            t("analytics.budget"),
            t("analytics.contractedInYear"),
          ]}
          footer={[
            t("analytics.footerProjects", { count: report.footer.projectCount }),
            "",
            "",
            "",
            <MoneyText key="b" value={report.footer.budget} />,
            <MoneyText key="c" value={report.footer.contractedInYear} />,
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
              <Table.Td>{row.deadline ? formatDate(row.deadline) : "—"}</Table.Td>
              <Table.Td>
                <MoneyText value={row.budget} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.contractedInYear} />
              </Table.Td>
            </Table.Tr>
          ))}
        </AnalyticsTable>
      )}
    </>
  );
}
