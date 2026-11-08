// Spec: UI-030, UI-040, UI-050, UI-090, DM-030, DM-040, DM-050
import { Badge } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { ContractType } from "../../core/domain/Contract";
import type { InvoiceStatus } from "../../core/domain/Invoice";
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

const INVOICE_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: "gray",
  ISSUED: "blue",
  PAID: "green",
  CANCELLED: "red",
};

/** Invoice status badge, labels from `enum.invoiceStatus.*` (UI-050). */
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation();
  return (
    <Badge color={INVOICE_COLORS[status]} variant="light">
      {t(`enum.invoiceStatus.${status}`)}
    </Badge>
  );
}
