// Spec: UI-020, UI-002a, BR-GEN-004, BR-GEN-007, UI-090
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { Subcontractor } from "../../../core/domain/Subcontractor";
import { ConfirmArchiveDialog } from "../../components/ConfirmDialog";
import { DataTable, type Column } from "../../components/DataTable";
import { ListToolbar } from "../../components/ListToolbar";
import { RowActions } from "../../components/RowActions";
import { ScreenTitle } from "../../components/ScreenTitle";
import { useAsyncList } from "../../components/useAsyncList";
import { SubcontractorForm } from "./SubcontractorForm";

export default function SubcontractorsScreen() {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState<{ subcontractor: Subcontractor | null } | null>(null);
  const [archiving, setArchiving] = useState<Subcontractor | null>(null);

  const rows = useAsyncList(
    () => useCases.listSubcontractors({ search, includeArchived: showArchived }),
    [useCases, search, showArchived, refresh],
  );
  const reload = () => setRefresh((n) => n + 1);

  const text = (key: keyof Subcontractor & string): Column<Subcontractor> => ({
    key,
    label: t(`entity.subcontractor.${key}`),
    render: (r) => r[key],
    sortValue: (r) => r[key] as string | null,
  });
  const columns: Column<Subcontractor>[] = [
    text("name"),
    text("vatNumber"),
    text("industry"),
    text("contactPerson"),
    text("email"),
    text("phone"),
  ];

  return (
    <>
      <ScreenTitle>{t("nav.subcontractors")}</ScreenTitle>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        showArchived={showArchived}
        onShowArchived={setShowArchived}
        onNew={() => setForm({ subcontractor: null })}
      />
      <DataTable
        rows={rows}
        columns={columns}
        defaultSort={{ key: "name", direction: "asc" }}
        onRowClick={(subcontractor) => setForm({ subcontractor })}
        emptyText={search.trim() ? t("common.noMatches") : t("common.noRecords")}
        actions={(subcontractor) => (
          <RowActions
            archived={subcontractor.archivedAt !== null}
            onEdit={() => setForm({ subcontractor })}
            onArchive={() => setArchiving(subcontractor)}
            onRestore={() => void useCases.restoreSubcontractor(subcontractor.id).then(reload)}
          />
        )}
      />
      <SubcontractorForm
        opened={form !== null}
        subcontractor={form?.subcontractor ?? null}
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
          if (archiving) await useCases.archiveSubcontractor(archiving.id);
          setArchiving(null);
          reload();
        }}
      />
    </>
  );
}
