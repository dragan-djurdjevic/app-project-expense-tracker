// Spec: UI-031, UI-002, UI-002b, DM-030, BR-GEN-006, BR-GEN-007, BR-PRJ-001, UI-090
import { Select, TextInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { ProjectListItem } from "../../../core/domain/Project";
import { PROJECT_STATUS_DEFAULT, PROJECT_STATUS_OPTIONS } from "../../../core/usecases/project/createProject";
import { FormDrawer } from "../../components/FormDrawer";
import { useEntityForm } from "../../components/useEntityForm";
import { dateToIso, isoToDate, parseDisplayDate } from "../../format/date";
import { parseMoney } from "../../format/money";

interface Values {
  name: string;
  investorId: string | null;
  status: string;
  deadline: Date | null;
  budget: string;
}

const EMPTY: Values = { name: "", investorId: null, status: PROJECT_STATUS_DEFAULT, deadline: null, budget: "" };

interface Option {
  value: string;
  label: string;
}

/** Create form (`project` null), edit form (active) or read-only view with Restore (archived). */
export function ProjectForm({
  opened,
  project,
  onClose,
  onDone,
}: {
  opened: boolean;
  project: ProjectListItem | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const form = useEntityForm();
  const [values, setValues] = useState<Values>(EMPTY);
  const [investors, setInvestors] = useState<Option[]>([]);
  const readOnly = project?.archivedAt != null;

  useEffect(() => {
    if (!opened) return;
    form.reset();
    setValues(
      project
        ? {
            name: project.name,
            investorId: project.investorId,
            status: project.status,
            deadline: project.deadline ? isoToDate(project.deadline) : null,
            budget: project.budget === null ? "" : (project.budget / 100).toFixed(2),
          }
        : EMPTY,
    );
    let active = true;
    // Picker offers active investors only, sorted by name (UI-002b); a project keeps showing its current investor
    // even when that investor was archived later (BR-GEN-006).
    void useCases.listInvestors({}).then((result) => {
      if (!active || !result.ok) return;
      const options = result.value.map((investor) => ({ value: investor.id, label: investor.name }));
      if (project && !options.some((option) => option.value === project.investorId)) {
        options.push({ value: project.investorId, label: project.investorName });
      }
      setInvestors(options);
    });
    return () => {
      active = false;
    };
  }, [opened, project, useCases]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = () => {
    let budget: number | null = null;
    if (values.budget.trim() !== "") {
      const parsed = parseMoney(values.budget);
      if (!parsed.ok) {
        form.showError({ ...parsed.error, field: "budget" });
        return;
      }
      budget = parsed.value;
    }
    const input = {
      name: values.name,
      investorId: values.investorId ?? "",
      status: values.status,
      deadline: values.deadline ? dateToIso(values.deadline) : null,
      budget,
    };
    void form.save(() => (project ? useCases.updateProject(project.id, input) : useCases.createProject(input)), onDone);
  };

  const title = readOnly ? t("entity.project.singular") : project ? t("entity.project.edit") : t("entity.project.new");

  return (
    <FormDrawer
      opened={opened}
      title={title}
      readOnly={readOnly}
      submitting={form.submitting}
      formError={form.formError}
      onClose={onClose}
      onSubmit={submit}
      onRestore={() => project && void form.restore(() => useCases.restoreProject(project.id), onDone)}
    >
      <TextInput
        label={t("entity.project.name")}
        withAsterisk
        value={values.name}
        onChange={(event) => set("name", event.currentTarget.value)}
        disabled={readOnly}
        data-testid="field-name"
        error={form.errorFor("name")}
      />
      <Select
        label={t("entity.project.investor")}
        withAsterisk
        data={investors}
        value={values.investorId}
        onChange={(value) => set("investorId", value)}
        searchable
        disabled={readOnly}
        data-testid="field-investorId"
        error={form.errorFor("investorId")}
      />
      <Select
        label={t("entity.project.status")}
        withAsterisk
        data={PROJECT_STATUS_OPTIONS.map((status) => ({ value: status, label: t(`enum.projectStatus.${status}`) }))}
        value={values.status}
        onChange={(value) => set("status", value ?? PROJECT_STATUS_DEFAULT)}
        allowDeselect={false}
        disabled={readOnly}
        data-testid="field-status"
        error={form.errorFor("status")}
      />
      <DateInput
        label={t("entity.project.deadline")}
        placeholder={t("common.datePlaceholder")}
        valueFormat="DD.MM.YYYY"
        dateParser={parseDisplayDate}
        value={values.deadline}
        onChange={(value) => set("deadline", value)}
        clearable
        disabled={readOnly}
        data-testid="field-deadline"
        error={form.errorFor("deadline")}
      />
      <TextInput
        label={t("entity.project.budget")}
        value={values.budget}
        onChange={(event) => set("budget", event.currentTarget.value)}
        disabled={readOnly}
        data-testid="field-budget"
        error={form.errorFor("budget")}
      />
    </FormDrawer>
  );
}
