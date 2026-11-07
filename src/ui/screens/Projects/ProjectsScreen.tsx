// Spec: UI-030, UI-002, UI-002a, UI-032, AN-3, BR-GEN-004, BR-GEN-007, UI-090
import { MultiSelect, Select } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../../app/AppProvider";
import type { ProjectListItem, ProjectStatus } from "../../../core/domain/Project";
import { PROJECT_STATUS_OPTIONS } from "../../../core/usecases/project/createProject";
import { ConfirmArchiveDialog } from "../../components/ConfirmDialog";
import { DataTable, type Column } from "../../components/DataTable";
import { ListToolbar } from "../../components/ListToolbar";
import { RowActions } from "../../components/RowActions";
import { ScreenTitle } from "../../components/ScreenTitle";
import { ProjectStatusBadge } from "../../components/StatusBadge";
import { useAsyncList } from "../../components/useAsyncList";
import { formatDate } from "../../format/date";
import { formatMoney } from "../../format/money";
import { ProjectForm } from "./ProjectForm";

const ALL_YEARS = "all";

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const { useCases, settings } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [year, setYear] = useState<string>(ALL_YEARS);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState<{ project: ProjectListItem | null } | null>(null);
  const [archiving, setArchiving] = useState<ProjectListItem | null>(null);

  const rows = useAsyncList(
    () =>
      useCases.listProjects({
        search,
        includeArchived: showArchived,
        status: statuses as ProjectStatus[],
        year: year === ALL_YEARS ? undefined : Number(year),
      }),
    [useCases, search, showArchived, statuses, year, refresh],
  );
  const years = useAsyncList(() => useCases.getAvailableYears(), [useCases, refresh]);
  const reload = () => setRefresh((n) => n + 1);

  const columns: Column<ProjectListItem>[] = [
    { key: "name", label: t("entity.project.name"), render: (r) => r.name, sortValue: (r) => r.name },
    {
      key: "investor",
      label: t("entity.project.investor"),
      render: (r) => r.investorName,
      sortValue: (r) => r.investorName,
    },
    {
      key: "status",
      label: t("entity.project.status"),
      render: (r) => <ProjectStatusBadge status={r.status} />,
      sortValue: (r) => t(`enum.projectStatus.${r.status}`),
    },
    {
      key: "deadline",
      label: t("entity.project.deadline"),
      render: (r) => (r.deadline ? formatDate(r.deadline) : null),
      sortValue: (r) => r.deadline,
    },
    {
      key: "budget",
      label: t("entity.project.budget"),
      render: (r) => (r.budget === null ? null : formatMoney(r.budget, settings.currency)),
      sortValue: (r) => r.budget,
    },
  ];

  return (
    <>
      <ScreenTitle>{t("nav.projects")}</ScreenTitle>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        showArchived={showArchived}
        onShowArchived={setShowArchived}
        onNew={() => setForm({ project: null })}
      >
        <MultiSelect
          aria-label={t("entity.project.status")}
          placeholder={t("entity.project.status")}
          data={PROJECT_STATUS_OPTIONS.map((status) => ({ value: status, label: t(`enum.projectStatus.${status}`) }))}
          value={statuses}
          onChange={setStatuses}
          clearable
          data-testid="filter-status"
        />
        <Select
          aria-label={t("entity.project.year")}
          data={[
            { value: ALL_YEARS, label: t("common.allYears") },
            ...years.map((y) => ({ value: String(y), label: String(y) })),
          ]}
          value={year}
          onChange={(value) => setYear(value ?? ALL_YEARS)}
          allowDeselect={false}
          w={140}
          data-testid="filter-year"
        />
      </ListToolbar>
      <DataTable
        rows={rows}
        columns={columns}
        defaultSort={{ key: "deadline", direction: "asc" }}
        onRowClick={(project) => setForm({ project })}
        emptyText={search.trim() ? t("common.noMatches") : t("common.noRecords")}
        actions={(project) => (
          <RowActions
            archived={project.archivedAt !== null}
            onOpen={() => navigate(`/projects/${project.id}`)}
            onEdit={() => setForm({ project })}
            onArchive={() => setArchiving(project)}
            onRestore={() => void useCases.restoreProject(project.id).then(reload)}
          />
        )}
      />
      <ProjectForm
        opened={form !== null}
        project={form?.project ?? null}
        onClose={() => setForm(null)}
        onDone={() => {
          setForm(null);
          reload();
        }}
      />
      <ConfirmArchiveDialog
        name={archiving?.name ?? null}
        onCancel={() => setArchiving(null)}
        onConfirm={async () => {
          if (archiving) await useCases.archiveProject(archiving.id);
          setArchiving(null);
          reload();
        }}
      />
    </>
  );
}
