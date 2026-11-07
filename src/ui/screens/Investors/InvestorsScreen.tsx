// Spec: UI-010, UI-002a, BR-GEN-004, BR-GEN-007, UI-090
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { InvestorListItem } from "../../../core/domain/Investor";
import { ConfirmArchiveDialog } from "../../components/ConfirmDialog";
import { DataTable, type Column } from "../../components/DataTable";
import { ListToolbar } from "../../components/ListToolbar";
import { RowActions } from "../../components/RowActions";
import { ScreenTitle } from "../../components/ScreenTitle";
import { useAsyncList } from "../../components/useAsyncList";
import { InvestorForm } from "./InvestorForm";

export default function InvestorsScreen() {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [form, setForm] = useState<{ investor: InvestorListItem | null } | null>(null);
  const [archiving, setArchiving] = useState<InvestorListItem | null>(null);

  const rows = useAsyncList(
    () => useCases.listInvestors({ search, includeArchived: showArchived }),
    [useCases, search, showArchived, refresh],
  );
  const reload = () => setRefresh((n) => n + 1);

  const columns: Column<InvestorListItem>[] = [
    { key: "name", label: t("entity.investor.name"), render: (r) => r.name, sortValue: (r) => r.name },
    {
      key: "vatNumber",
      label: t("entity.investor.vatNumber"),
      render: (r) => r.vatNumber,
      sortValue: (r) => r.vatNumber,
    },
    {
      key: "contactPerson",
      label: t("entity.investor.contactPerson"),
      render: (r) => r.contactPerson,
      sortValue: (r) => r.contactPerson,
    },
    { key: "email", label: t("entity.investor.email"), render: (r) => r.email, sortValue: (r) => r.email },
    { key: "phone", label: t("entity.investor.phone"), render: (r) => r.phone, sortValue: (r) => r.phone },
    {
      key: "projects",
      label: t("entity.investor.projects"),
      render: (r) => r.projectCount,
      sortValue: (r) => r.projectCount,
    },
  ];

  return (
    <>
      <ScreenTitle>{t("nav.investors")}</ScreenTitle>
      <ListToolbar
        search={search}
        onSearch={setSearch}
        showArchived={showArchived}
        onShowArchived={setShowArchived}
        onNew={() => setForm({ investor: null })}
      />
      <DataTable
        rows={rows}
        columns={columns}
        defaultSort={{ key: "name", direction: "asc" }}
        onRowClick={(investor) => setForm({ investor })}
        emptyText={search.trim() ? t("common.noMatches") : t("common.noRecords")}
        actions={(investor) => (
          <RowActions
            archived={investor.archivedAt !== null}
            onEdit={() => setForm({ investor })}
            onArchive={() => setArchiving(investor)}
            onRestore={() => void useCases.restoreInvestor(investor.id).then(reload)}
          />
        )}
      />
      <InvestorForm
        opened={form !== null}
        investor={form?.investor ?? null}
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
          if (archiving) await useCases.archiveInvestor(archiving.id);
          setArchiving(null);
          reload();
        }}
      />
    </>
  );
}
