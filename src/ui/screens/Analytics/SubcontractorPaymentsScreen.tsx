// Spec: UI-062, UI-060, AN-2, AN-000, UI-090
import { ActionIcon, Group, Table } from "@mantine/core";
import { Fragment, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { SubcontractorPaymentReport } from "../../../core/domain/Analytics";
import { ScreenTitle } from "../../components/ScreenTitle";
import { useYearSelection, YearFilter } from "../../components/YearFilter";
import { AnalyticsTable, GrossToggle, MoneyText, PercentText, ProjectCell } from "./AnalyticsParts";

/** UI-062 Subcontractor payments & company share (AN-2) with expandable per-subcontractor rows. */
export default function SubcontractorPaymentsScreen() {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const { years, year, setYear } = useYearSelection();
  const [gross, setGross] = useState(false);
  const [report, setReport] = useState<SubcontractorPaymentReport | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (year === null) return;
    let active = true;
    void useCases.getSubcontractorPayments(year, gross ? "GROSS" : "NET").then((result) => {
      if (active && result.ok) setReport(result.value);
    });
    return () => {
      active = false;
    };
  }, [useCases, year, gross]);

  const toggle = (projectId: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });

  const contractedOutLabel = gross
    ? t("analytics.netSuffix", { label: t("analytics.contractedOut") })
    : t("analytics.contractedOut");

  return (
    <>
      <ScreenTitle>{t("nav.analyticsSubcontractors")}</ScreenTitle>
      <Group align="flex-end" mb="md">
        <YearFilter years={years} value={year} onChange={setYear} allowAll />
        <GrossToggle gross={gross} onChange={setGross} />
      </Group>
      {report && (
        <AnalyticsTable
          headers={[
            t("analytics.project"),
            contractedOutLabel,
            t("analytics.paidOut"),
            t("analytics.paidPercent"),
            t("analytics.collectedFromInvestor"),
            t("analytics.sharePercent"),
            t("analytics.retained"),
            t("analytics.retainedPercent"),
          ]}
          footer={[
            "",
            <MoneyText key="co" value={report.footer.contractedOut} />,
            <MoneyText key="po" value={report.footer.paidOut} />,
            <PercentText key="pp" value={report.footer.paidPercent} />,
            <MoneyText key="c" value={report.footer.collected} />,
            <PercentText key="sp" value={report.footer.sharePercent} />,
            <MoneyText key="r" value={report.footer.retained} />,
            <PercentText key="rp" value={report.footer.retainedPercent} />,
          ]}
        >
          {report.rows.map((row) => {
            const expandable = row.subcontractors.length > 0;
            const open = expanded.has(row.projectId);
            return (
              <Fragment key={row.projectId}>
                <Table.Tr data-testid={`row-${row.projectId}`}>
                  <Table.Td>
                    <Group gap="xs" wrap="nowrap">
                      {expandable && (
                        <ActionIcon
                          variant="subtle"
                          size="sm"
                          aria-label={t("analytics.expand")}
                          aria-expanded={open}
                          onClick={() => toggle(row.projectId)}
                          data-testid={`btn-expand-${row.projectId}`}
                        >
                          {open ? "▾" : "▸"}
                        </ActionIcon>
                      )}
                      <ProjectCell id={row.projectId} name={row.projectName} archived={row.projectArchived} />
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <MoneyText value={row.contractedOut} />
                  </Table.Td>
                  <Table.Td>
                    <MoneyText value={row.paidOut} />
                  </Table.Td>
                  <Table.Td>
                    <PercentText value={row.paidPercent} />
                  </Table.Td>
                  <Table.Td>
                    <MoneyText value={row.collected} />
                  </Table.Td>
                  <Table.Td>
                    <PercentText value={row.sharePercent} />
                  </Table.Td>
                  <Table.Td>
                    <MoneyText value={row.retained} />
                  </Table.Td>
                  <Table.Td>
                    <PercentText value={row.retainedPercent} />
                  </Table.Td>
                </Table.Tr>
                {open &&
                  row.subcontractors.map((sub) => (
                    <Table.Tr
                      key={sub.subcontractorId}
                      data-testid={`subrow-${row.projectId}-${sub.subcontractorId}`}
                      bg="gray.0"
                    >
                      <Table.Td pl="xl">↳ {sub.subcontractorName}</Table.Td>
                      <Table.Td>
                        <MoneyText value={sub.contractedOut} />
                      </Table.Td>
                      <Table.Td>
                        <MoneyText value={sub.paidOut} />
                      </Table.Td>
                      <Table.Td>
                        <PercentText value={sub.paidPercent} />
                      </Table.Td>
                      <Table.Td />
                      <Table.Td>
                        <PercentText value={sub.sharePercent} />
                      </Table.Td>
                      <Table.Td />
                      <Table.Td />
                    </Table.Tr>
                  ))}
              </Fragment>
            );
          })}
        </AnalyticsTable>
      )}
    </>
  );
}
