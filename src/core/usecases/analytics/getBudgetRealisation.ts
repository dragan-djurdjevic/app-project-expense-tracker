// Spec: AR-005, AN-000, AN-5, UI-065, UI-033
import type { BudgetRealisationReport } from "../../domain/Analytics";
import type { Money } from "../../domain/Money";
import { percent, sumOf, type Percent } from "../../domain/Percent";
import type { ProjectStatus } from "../../domain/Project";
import { ok, type Result } from "../../domain/Result";
import type { AnalyticsQuery } from "../../ports/AnalyticsQuery";

/** `statuses` empty = all statuses (AN-5 default). */
export type GetBudgetRealisation = (statuses?: ProjectStatus[]) => Promise<Result<BudgetRealisationReport>>;

/** AN-5: percentages of a null or 0 budget → null ("—"). */
const ofBudget = (value: Money, budget: Money | null): Percent => (budget === null ? null : percent(value, budget));

/**
 * AN-5 rows and footer. Footer "% of budget" uses only projects with a non-null budget in numerator and denominator;
 * "Realisation % of contracted" uses all rows.
 */
export function makeGetBudgetRealisation({ analyticsQuery }: { analyticsQuery: AnalyticsQuery }): GetBudgetRealisation {
  return async (statuses = []) => {
    const rows = (await analyticsQuery.budgetRealisation(statuses)).map((row) => ({
      ...row,
      contractedPercentOfBudget: ofBudget(row.contracted, row.budget),
      realisationPercentOfBudget: ofBudget(row.collected, row.budget),
      realisationPercentOfContracted: percent(row.collected, row.contracted),
      remaining: row.budget === null ? null : row.budget - row.collected,
    }));
    const budgeted = rows.filter((row) => row.budget !== null);
    const budget = sumOf(budgeted, (row) => row.budget ?? 0);
    const contracted = sumOf(rows, (row) => row.contracted);
    const collected = sumOf(rows, (row) => row.collected);
    return ok({
      rows,
      footer: {
        budget,
        contracted,
        invoiced: sumOf(rows, (row) => row.invoiced),
        collected,
        remaining: sumOf(budgeted, (row) => row.remaining ?? 0),
        contractedPercentOfBudget: percent(
          sumOf(budgeted, (row) => row.contracted),
          budget,
        ),
        realisationPercentOfBudget: percent(
          sumOf(budgeted, (row) => row.collected),
          budget,
        ),
        realisationPercentOfContracted: percent(collected, contracted),
      },
    });
  };
}
