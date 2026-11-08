// Spec: AR-005, AN-000, AN-4, UI-064
import type { AnalyticsMode, NetResultReport, NetResultTotals, YearSelection } from "../../domain/Analytics";
import type { Money } from "../../domain/Money";
import { percent, sumOf } from "../../domain/Percent";
import { ok, type Result } from "../../domain/Result";
import type { AnalyticsQuery } from "../../ports/AnalyticsQuery";

export type GetNetResult = (year: YearSelection, mode: AnalyticsMode) => Promise<Result<NetResultReport>>;

interface Amounts {
  collected: Money;
  paidOut: Money;
}

/** AN-4 columns: amounts in the selected mode, margin from net values (AN-000c). */
function totals(shown: Amounts, net: Amounts): NetResultTotals {
  return {
    collected: shown.collected,
    paidOut: shown.paidOut,
    net: shown.collected - shown.paidOut,
    marginPercent: percent(net.collected - net.paidOut, net.collected),
  };
}

const sums = (rows: readonly Amounts[]): Amounts => ({
  collected: sumOf(rows, (row) => row.collected),
  paidOut: sumOf(rows, (row) => row.paidOut),
});

/** AN-4 rows (union of AN-1 and AN-2 rows) and footer computed from footer totals (AN-000e). */
export function makeGetNetResult({ analyticsQuery }: { analyticsQuery: AnalyticsQuery }): GetNetResult {
  return async (year, mode) => {
    const netRows = await analyticsQuery.netPerProject(year, "NET");
    const shownRows = mode === "NET" ? netRows : await analyticsQuery.netPerProject(year, mode);
    const netById = new Map(netRows.map((row) => [row.projectId, row]));
    const rows = shownRows.map((row) => ({
      projectId: row.projectId,
      projectName: row.projectName,
      projectArchived: row.projectArchived,
      ...totals(row, netById.get(row.projectId) ?? row),
    }));
    return ok({ rows, footer: totals(sums(shownRows), sums(netRows)) });
  };
}
