// Spec: AR-005, AN-000, AN-2, UI-062
import type {
  AnalyticsMode,
  SubcontractorPaymentReport,
  SubcontractorPaymentRow,
  SubcontractorPaymentTotals,
  YearSelection,
} from "../../domain/Analytics";
import type { Money } from "../../domain/Money";
import { percent, sumOf } from "../../domain/Percent";
import { ok, type Result } from "../../domain/Result";
import type { AnalyticsQuery } from "../../ports/AnalyticsQuery";

export type GetSubcontractorPayments = (
  year: YearSelection,
  mode: AnalyticsMode,
) => Promise<Result<SubcontractorPaymentReport>>;

interface NetValues {
  contractedOut: Money;
  paidOut: Money;
  collected: Money;
}

/** AN-2 columns from shown amounts (selected mode) and net amounts (percentages, AN-000c). */
function totals(shown: NetValues, net: NetValues): SubcontractorPaymentTotals {
  return {
    contractedOut: shown.contractedOut,
    paidOut: shown.paidOut,
    paidPercent: percent(net.paidOut, net.contractedOut),
    collected: shown.collected,
    sharePercent: percent(net.paidOut, net.collected),
    retained: shown.collected - shown.paidOut,
    retainedPercent: percent(net.collected - net.paidOut, net.collected),
  };
}

const sums = (rows: readonly NetValues[]): NetValues => ({
  contractedOut: sumOf(rows, (row) => row.contractedOut),
  paidOut: sumOf(rows, (row) => row.paidOut),
  collected: sumOf(rows, (row) => row.collected),
});

/** AN-2 rows (with per-subcontractor sub-rows sorted by name) and footer computed from footer totals (AN-000e). */
export function makeGetSubcontractorPayments({
  analyticsQuery,
}: {
  analyticsQuery: AnalyticsQuery;
}): GetSubcontractorPayments {
  return async (year, mode) => {
    const netRows = await analyticsQuery.subcontractorPayments(year, "NET");
    const shownRows = mode === "NET" ? netRows : await analyticsQuery.subcontractorPayments(year, mode);
    const netById = new Map<string, SubcontractorPaymentRow>(netRows.map((row) => [row.projectId, row]));
    const rows = shownRows.map((row) => {
      const net = netById.get(row.projectId) ?? row;
      const netPaid = new Map(net.subcontractors.map((sub) => [sub.subcontractorId, sub.paidOut]));
      return {
        projectId: row.projectId,
        projectName: row.projectName,
        projectArchived: row.projectArchived,
        ...totals(row, net),
        subcontractors: row.subcontractors.map((sub) => {
          const paid = netPaid.get(sub.subcontractorId) ?? 0;
          return {
            ...sub,
            paidPercent: percent(paid, sub.contractedOut),
            sharePercent: percent(paid, net.collected),
          };
        }),
      };
    });
    return ok({ rows, footer: totals(sums(shownRows), sums(netRows)) });
  };
}
