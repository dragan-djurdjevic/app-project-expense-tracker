// Spec: AR-005, AN-000, AN-3, UI-063
import type { ProjectsInYearReport } from "../../domain/Analytics";
import { sumOf } from "../../domain/Percent";
import { ok, type Result } from "../../domain/Result";
import type { AnalyticsQuery } from "../../ports/AnalyticsQuery";

export type GetProjectsInYear = (year: number) => Promise<Result<ProjectsInYearReport>>;

/** AN-3 rows and footer (`Projects: <count>`, Σ budget with nulls ignored, Σ contracted in year). */
export function makeGetProjectsInYear({ analyticsQuery }: { analyticsQuery: AnalyticsQuery }): GetProjectsInYear {
  return async (year) => {
    const rows = await analyticsQuery.projectsInYear(year);
    return ok({
      rows,
      footer: {
        projectCount: rows.length,
        budget: sumOf(rows, (row) => row.budget ?? 0),
        contractedInYear: sumOf(rows, (row) => row.contractedInYear),
      },
    });
  };
}
