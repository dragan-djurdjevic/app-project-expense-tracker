// Spec: UI-050, UI-002, UI-002a, UI-032, DM-050, BR-GEN-004, BR-GEN-007, UI-090
import { ActionIcon, MultiSelect, Select, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { ContractType } from "../../../core/domain/Contract";
import type { InvoiceListRow, InvoiceStatus } from "../../../core/domain/Invoice";
import { CONTRACT_TYPE_OPTIONS } from "../../../core/usecases/contract/createContract";
import { INVOICE_STATUS_OPTIONS } from "../../../core/usecases/invoice/createInvoice";
import { ConfirmArchiveDialog } from "../../components/ConfirmDialog";
import { DataTable, type Column } from "../../components/DataTable";
import { ListToolbar } from "../../components/ListToolbar";
import { RowActions } from "../../components/RowActions";
import { ContractTypeBadge, InvoiceStatusBadge } from "../../components/StatusBadge";
import { useAsyncList } from "../../components/useAsyncList";
import { formatDate } from "../../format/date";
import { formatMoney } from "../../format/money";
import { formatVatRate } from "../../format/vatPercent";
import { InvoiceForm } from "./InvoiceForm";

const ALL = "all";

/**
 * Invoices list (UI-050). With `projectId` it is the project-detail Invoices tab (UI-032): fixed to that project and
 * without the Project filter; "New" stays available also for an archived project.
 */
export function InvoiceList({ projectId, onChanged }: { projectId?: string; onChanged?: () => void }) {
  const { t } = useTranslation();
  const { useCases, settings } = useApp();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [direction, setDirection] = useState<string>(ALL);
  const [projectFilter, setProjectFilter] = useState<string>(ALL);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState<{ invoice: InvoiceListRow | null } | null>(null);
  const [archiving, setArchiving] = useState<InvoiceListRow | null>(null);
  const fixedProject = projectId !== undefined;

  const rows = useAsyncList(
    () =>
      useCases.listInvoices({
        search,
        includeArchived: showArchived,
        status: statuses as InvoiceStatus[],
        direction: direction === ALL ? undefined : (direction as ContractType),
        projectId: fixedProject ? projectId : projectFilter === ALL ? undefined : projectFilter,
      }),
    [useCases, search, showArchived, statuses, direction, projectFilter, projectId, refresh],
  );
  // Project filter: all projects incl. archived, sorted by name (as UI-040).
  const projects = useAsyncList(async () => {
    if (fixedProject) return { ok: true as const, value: [] };
    const result = await useCases.listProjects({ includeArchived: true });
    if (!result.ok) return result;
    return {
      ok: true as const,
      value: [...result.value].sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" })),
    };
  }, [useCases, fixedProject, refresh]);
  const reload = () => {
    setRefresh((n) => n + 1);
    onChanged?.();
  };
  const money = (value: number) => formatMoney(value, settings.currency);

  const columns: Column<InvoiceListRow>[] = [
    { key: "number", label: t("entity.invoice.number"), render: (r) => r.number, sortValue: (r) => r.number },
    {
      key: "direction",
      label: t("entity.invoice.direction"),
      render: (r) => <ContractTypeBadge type={r.direction} />,
      sortValue: (r) => t(`entity.contract.typeBadge.${r.direction}`),
    },
    {
      key: "contract",
      label: t("entity.invoice.contract"),
      render: (r) => r.contractNumber,
      sortValue: (r) => r.contractNumber,
    },
    {
      key: "project",
      label: t("entity.invoice.project"),
      render: (r) => r.projectName,
      sortValue: (r) => r.projectName,
    },
    { key: "date", label: t("entity.invoice.date"), render: (r) => formatDate(r.date), sortValue: (r) => r.date },
    {
      key: "dueDate",
      label: t("entity.invoice.dueDate"),
      render: (r) =>
        r.dueDate === null ? (
          ""
        ) : (
          <Text size="sm" c={r.overdue ? "red" : undefined} span>
            {formatDate(r.dueDate)}
          </Text>
        ),
      sortValue: (r) => r.dueDate,
    },
    { key: "net", label: t("entity.invoice.net"), render: (r) => money(r.value), sortValue: (r) => r.value },
    {
      key: "vatRate",
      label: t("entity.invoice.vatPercent"),
      render: (r) => formatVatRate(r.vatRate),
      sortValue: (r) => r.vatRate,
    },
    { key: "gross", label: t("entity.invoice.gross"), render: (r) => money(r.gross), sortValue: (r) => r.gross },
    {
      key: "status",
      label: t("entity.invoice.status"),
      render: (r) => <InvoiceStatusBadge status={r.status} />,
      sortValue: (r) => t(`enum.invoiceStatus.${r.status}`),
    },
    {
      key: "attachment",
      label: t("entity.invoice.attachment"),
      render: (r) =>
        r.attachment ? (
          <ActionIcon
            variant="subtle"
            aria-label={r.attachment.originalName}
            onClick={(event) => {
              event.stopPropagation();
              void useCases.openInvoiceDocument(r.id);
            }}
            data-testid="icon-attachment"
          >
            📎
          </ActionIcon>
        ) : null,
      sortValue: (r) => r.attachment?.originalName ?? null,
    },
  ];

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        showArchived={showArchived}
        onShowArchived={setShowArchived}
        onNew={() => setForm({ invoice: null })}
      >
        <MultiSelect
          aria-label={t("entity.invoice.status")}
          placeholder={t("entity.invoice.status")}
          data={INVOICE_STATUS_OPTIONS.map((status) => ({ value: status, label: t(`enum.invoiceStatus.${status}`) }))}
          value={statuses}
          onChange={setStatuses}
          clearable
          data-testid="filter-status"
        />
        <Select
          aria-label={t("entity.invoice.direction")}
          data={[
            { value: ALL, label: t("common.all") },
            ...CONTRACT_TYPE_OPTIONS.map((value) => ({ value, label: t(`enum.contractType.${value}`) })),
          ]}
          value={direction}
          onChange={(value) => setDirection(value ?? ALL)}
          allowDeselect={false}
          w={140}
          data-testid="filter-type"
        />
        {!fixedProject && (
          <Select
            aria-label={t("entity.invoice.project")}
            data={[
              { value: ALL, label: t("common.allProjects") },
              ...projects.map((project) => ({ value: project.id, label: project.name })),
            ]}
            value={projectFilter}
            onChange={(value) => setProjectFilter(value ?? ALL)}
            allowDeselect={false}
            searchable
            w={220}
            data-testid="filter-project"
          />
        )}
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        defaultSort={{ key: "date", direction: "desc" }}
        onRowClick={(invoice) => setForm({ invoice })}
        emptyText={search.trim() ? t("common.noMatches") : t("common.noRecords")}
        actions={(invoice) => (
          <RowActions
            archived={invoice.archivedAt !== null}
            onEdit={() => setForm({ invoice })}
            onArchive={() => setArchiving(invoice)}
            onRestore={() => void useCases.restoreInvoice(invoice.id).then(reload)}
          />
        )}
      />
      <InvoiceForm
        opened={form !== null}
        invoice={form?.invoice ?? null}
        presetProjectId={projectId}
        onClose={() => setForm(null)}
        onDone={() => {
          setForm(null);
          reload();
        }}
      />
      <ConfirmArchiveDialog
        name={archiving?.number ?? null}
        onCancel={() => setArchiving(null)}
        onConfirm={async () => {
          if (archiving) await useCases.archiveInvoice(archiving.id);
          setArchiving(null);
          reload();
        }}
      />
    </>
  );
}
