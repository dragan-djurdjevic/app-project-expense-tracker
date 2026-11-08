// Spec: UI-064, UI-060, AN-4, AN-000, UI-090
import { Group, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { NetResultReport } from "../../../core/domain/Analytics";
import { ScreenTitle } from "../../components/ScreenTitle";
import { useYearSelection, YearFilter } from "../../components/YearFilter";
import { AnalyticsTable, GrossToggle, MoneyText, PercentText, ProjectCell } from "./AnalyticsParts";

/** UI-064 Net result (AN-4). */
export default function NetResultScreen() {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const { years, year, setYear } = useYearSelection();
  const [gross, setGross] = useState(false);
  const [report, setReport] = useState<NetResultReport | null>(null);

  useEffect(() => {
    if (year === null) return;
    let active = true;
    void useCases.getNetResult(year, gross ? "GROSS" : "NET").then((result) => {
      if (active && result.ok) setReport(result.value);
    });
    return () => {
      active = false;
    };
  }, [useCases, year, gross]);

  return (
    <>
      <ScreenTitle>{t("nav.analyticsNet")}</ScreenTitle>
      <Group align="flex-end" mb="md">
        <YearFilter years={years} value={year} onChange={setYear} allowAll />
        <GrossToggle gross={gross} onChange={setGross} />
      </Group>
      {report && (
        <AnalyticsTable
          headers={[
            t("analytics.project"),
            t("analytics.collected"),
            t("analytics.paidOut"),
            t("analytics.net"),
            t("analytics.marginPercent"),
          ]}
          footer={[
            "",
            <MoneyText key="c" value={report.footer.collected} />,
            <MoneyText key="p" value={report.footer.paidOut} />,
            <MoneyText key="n" value={report.footer.net} />,
            <PercentText key="m" value={report.footer.marginPercent} />,
          ]}
        >
          {report.rows.map((row) => (
            <Table.Tr key={row.projectId} data-testid={`row-${row.projectId}`}>
              <Table.Td>
                <ProjectCell id={row.projectId} name={row.projectName} archived={row.projectArchived} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.collected} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.paidOut} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.net} />
              </Table.Td>
              <Table.Td>
                <PercentText value={row.marginPercent} />
              </Table.Td>
            </Table.Tr>
          ))}
        </AnalyticsTable>
      )}
    </>
  );
}
