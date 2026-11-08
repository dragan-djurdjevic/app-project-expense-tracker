// Spec: UI-030, UI-040, UI-090, DM-030, DM-040
import { Badge } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ContractType } from "../../core/domain/Contract";
import type { ProjectStatus } from "../../core/domain/Project";

const COLORS: Record<ProjectStatus, string> = {
  PLANNED: "gray",
  ACTIVE: "blue",
  ON_HOLD: "yellow",
  DONE: "green",
  CANCELLED: "red",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useTranslation();
  return (
    <Badge color={COLORS[status]} variant="light">
      {t(`enum.projectStatus.${status}`)}
    </Badge>
  );
}

/** Contract type badge "In" / "Out" (UI-040). */
export function ContractTypeBadge({ type }: { type: ContractType }) {
  const { t } = useTranslation();
  return (
    <Badge color={type === "INCOMING" ? "teal" : "orange"} variant="light">
      {t(`entity.contract.typeBadge.${type}`)}
    </Badge>
  );
}
