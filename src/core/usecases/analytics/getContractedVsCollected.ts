// Spec: AR-005, AN-000, AN-1, UI-061
import type { AnalyticsMode, ContractedVsCollectedReport, YearSelection } from "../../domain/Analytics";
import { percent, sumOf } from "../../domain/Percent";
import { ok, type Result } from "../../domain/Result";
import type { AnalyticsQuery } from "../../ports/AnalyticsQuery";

export type GetContractedVsCollected = (
  year: YearSelection,
  mode: AnalyticsMode,
) => Promise<Result<ContractedVsCollectedReport>>;

/** AN-1 rows with Collected % and footer; amounts in the selected mode, percentages from net values (AN-000c). */
export function makeGetContractedVsCollected({
  analyticsQuery,
}: {
  analyticsQuery: AnalyticsQuery;
}): GetContractedVsCollected {
  return async (year, mode) => {
    const netRows = await analyticsQuery.contractedVsCollected(year, "NET");
    const shownRows = mode === "NET" ? netRows : await analyticsQuery.contractedVsCollected(year, mode);
    const netCollected = new Map(netRows.map((row) => [row.projectId, row.collected]));
    const rows = shownRows.map((row) => ({
      ...row,
      collectedPercent: percent(netCollected.get(row.projectId) ?? 0, row.contracted),
    }));
    const contracted = sumOf(rows, (row) => row.contracted);
    return ok({
      rows,
      footer: {
        projectCount: rows.length,
        contractedInYearCount: rows.filter((row) => row.contractedInYear).length,
        contracted,
        collected: sumOf(rows, (row) => row.collected),
        collectedPercent: percent(
          sumOf(netRows, (row) => row.collected),
          contracted,
        ),
      },
    });
  };
}
