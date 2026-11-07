// Spec: AR-005, AN-000, AN-3, UI-030
import { ok, type Result } from "../../domain/Result";
import type { Clock } from "../../ports/Clock";
import type { ProjectRepository } from "../../ports/ProjectRepository";

export type GetAvailableYears = () => Promise<Result<number[]>>;

/** AN-000h: distinct years of contract dates, invoice dates and project deadlines, descending; empty → [current year]. */
export function makeGetAvailableYears({
  projectRepo,
  clock,
}: {
  projectRepo: ProjectRepository;
  clock: Clock;
}): GetAvailableYears {
  return async () => {
    const years = await projectRepo.availableYears();
    return ok(years.length > 0 ? years : [clock.now().getFullYear()]);
  };
}
