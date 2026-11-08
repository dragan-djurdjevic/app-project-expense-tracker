// Spec: UI-061, UI-060, AN-1, AN-000, UI-090
import { Group, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { ContractedVsCollectedReport } from "../../../core/domain/Analytics";
import { ScreenTitle } from "../../components/ScreenTitle";
import { useYearSelection, YearFilter } from "../../components/YearFilter";
import { AnalyticsTable, GrossToggle, MoneyText, PercentText, ProjectCell } from "./AnalyticsParts";

/** UI-061 Contracted vs collected (AN-1). */
export default function ContractedVsCollectedScreen() {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const { years, year, setYear } = useYearSelection();
  const [gross, setGross] = useState(false);
  const [report, setReport] = useState<ContractedVsCollectedReport | null>(null);

  useEffect(() => {
    if (year === null) return;
    let active = true;
    void useCases.getContractedVsCollected(year, gross ? "GROSS" : "NET").then((result) => {
      if (active && result.ok) setReport(result.value);
    });
    return () => {
      active = false;
    };
  }, [useCases, year, gross]);

  const contractedLabel = gross
    ? t("analytics.netSuffix", { label: t("analytics.contracted") })
    : t("analytics.contracted");

  return (
    <>
      <ScreenTitle>{t("nav.analyticsContracted")}</ScreenTitle>
      <Group align="flex-end" mb="md">
        <YearFilter years={years} value={year} onChange={setYear} allowAll />
        <GrossToggle gross={gross} onChange={setGross} />
      </Group>
      {report && (
        <AnalyticsTable
          headers={[
            t("analytics.project"),
            t("analytics.investor"),
            contractedLabel,
            t("analytics.collected"),
            t("analytics.collectedPercent"),
          ]}
          footer={[
            t("analytics.footerProjectsContracted", {
              count: report.footer.projectCount,
              contracted: report.footer.contractedInYearCount,
            }),
            "",
            <MoneyText key="c" value={report.footer.contracted} />,
            <MoneyText key="k" value={report.footer.collected} />,
            <PercentText key="p" value={report.footer.collectedPercent} />,
          ]}
        >
          {report.rows.map((row) => (
            <Table.Tr key={row.projectId} data-testid={`row-${row.projectId}`}>
              <Table.Td>
                <ProjectCell id={row.projectId} name={row.projectName} archived={row.projectArchived} />
              </Table.Td>
              <Table.Td>{row.investorName}</Table.Td>
              <Table.Td>
                <MoneyText value={row.contracted} />
              </Table.Td>
              <Table.Td>
                <MoneyText value={row.collected} />
              </Table.Td>
              <Table.Td>
                <PercentText value={row.collectedPercent} />
              </Table.Td>
            </Table.Tr>
          ))}
        </AnalyticsTable>
      )}
    </>
  );
}
