// Spec: UI-040, UI-002, UI-002a, UI-032, DM-040, BR-GEN-004, BR-GEN-006, BR-GEN-007, UI-090, DM-060
import { Select } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { ContractListItem, ContractType } from "../../../core/domain/Contract";
import { CONTRACT_TYPE_OPTIONS } from "../../../core/usecases/contract/createContract";
import { ConfirmArchiveDialog } from "../../components/ConfirmDialog";
import { DataTable, type Column } from "../../components/DataTable";
import { ListToolbar } from "../../components/ListToolbar";
import { RowActions } from "../../components/RowActions";
import { ContractTypeBadge } from "../../components/StatusBadge";
import { useAsyncList } from "../../components/useAsyncList";
import { formatDate } from "../../format/date";
import { compareText } from "../../format/locale";
import { formatMoney } from "../../format/money";
import { ContractForm } from "./ContractForm";

const ALL = "all";

/**
 * Contracts list (UI-040). With `projectId` it is the project-detail Contracts tab (UI-032): fixed to that project,
 * no Project filter, and no "New" button when the project is archived.
 */
export function ContractList({
  projectId,
  projectArchived = false,
  onChanged,
}: {
  projectId?: string;
  projectArchived?: boolean;
  onChanged?: () => void;
}) {
  const { t } = useTranslation();
  const { useCases, settings } = useApp();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [type, setType] = useState<string>(ALL);
  const [projectFilter, setProjectFilter] = useState<string>(ALL);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState<{ contract: ContractListItem | null } | null>(null);
  const [archiving, setArchiving] = useState<ContractListItem | null>(null);
  const fixedProject = projectId !== undefined;

  const rows = useAsyncList(
    () =>
      useCases.listContracts({
        search,
        includeArchived: showArchived,
        type: type === ALL ? undefined : (type as ContractType),
        projectId: fixedProject ? projectId : projectFilter === ALL ? undefined : projectFilter,
      }),
    [useCases, search, showArchived, type, projectFilter, projectId, refresh],
  );
  // Project filter: all projects incl. archived, sorted by name (UI-040).
  const projects = useAsyncList(async () => {
    if (fixedProject) return { ok: true as const, value: [] };
    const result = await useCases.listProjects({ includeArchived: true });
    if (!result.ok) return result;
    return {
      ok: true as const,
      value: [...result.value].sort((a, b) => compareText(a.name, b.name, settings.language)),
    };
  }, [useCases, fixedProject, refresh, settings.language]);
  const reload = () => {
    setRefresh((n) => n + 1);
    onChanged?.();
  };
  const money = (value: number) => formatMoney(value, settings.currency, settings.language);

  const columns: Column<ContractListItem>[] = [
    { key: "number", label: t("entity.contract.number"), render: (r) => r.number, sortValue: (r) => r.number },
    {
      key: "type",
      label: t("entity.contract.type"),
      render: (r) => <ContractTypeBadge type={r.type} />,
      sortValue: (r) => t(`entity.contract.typeBadge.${r.type}`),
    },
    {
      key: "project",
      label: t("entity.contract.project"),
      render: (r) => r.projectName,
      sortValue: (r) => r.projectName,
    },
    {
      key: "counterparty",
      label: t("entity.contract.counterparty"),
      render: (r) => r.counterpartyName,
      sortValue: (r) => r.counterpartyName,
    },
    { key: "date", label: t("entity.contract.date"), render: (r) => formatDate(r.date), sortValue: (r) => r.date },
    { key: "value", label: t("entity.contract.value"), render: (r) => money(r.value), sortValue: (r) => r.value },
    {
      key: "invoiced",
      label: t("entity.contract.invoiced"),
      render: (r) => money(r.invoiced),
      sortValue: (r) => r.invoiced,
    },
    { key: "paid", label: t("entity.contract.paid"), render: (r) => money(r.paid), sortValue: (r) => r.paid },
  ];

  return (
    <>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        showArchived={showArchived}
        onShowArchived={setShowArchived}
        onNew={fixedProject && projectArchived ? undefined : () => setForm({ contract: null })}
      >
        <Select
          aria-label={t("entity.contract.type")}
          data={[
            { value: ALL, label: t("common.all") },
            ...CONTRACT_TYPE_OPTIONS.map((value) => ({ value, label: t(`enum.contractType.${value}`) })),
          ]}
          value={type}
          onChange={(value) => setType(value ?? ALL)}
          allowDeselect={false}
          w={140}
          data-testid="filter-type"
        />
        {!fixedProject && (
          <Select
            aria-label={t("entity.contract.project")}
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
        onRowClick={(contract) => setForm({ contract })}
        emptyText={search.trim() ? t("common.noMatches") : t("common.noRecords")}
        actions={(contract) => (
          <RowActions
            archived={contract.archivedAt !== null}
            onEdit={() => setForm({ contract })}
            onArchive={() => setArchiving(contract)}
            onRestore={() => void useCases.restoreContract(contract.id).then(reload)}
          />
        )}
      />
      <ContractForm
        opened={form !== null}
        contract={form?.contract ?? null}
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
          if (archiving) await useCases.archiveContract(archiving.id);
          setArchiving(null);
          reload();
        }}
      />
    </>
  );
}
