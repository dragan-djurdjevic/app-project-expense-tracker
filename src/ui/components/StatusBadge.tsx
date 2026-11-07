// Spec: UI-030, UI-090, DM-030
import { Badge } from "@mantine/core";
import { useTranslation } from "react-i18next";
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
