// Spec: UI-041, UI-002, UI-002b, DM-040, BR-CON-002, BR-CON-003, BR-CON-005, BR-GEN-006, BR-GEN-007, UI-032, UI-090
import { Input, SegmentedControl, Select, Text, TextInput, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { ContractListItem, ContractType } from "../../../core/domain/Contract";
import { CONTRACT_TYPE_DEFAULT, CONTRACT_TYPE_OPTIONS } from "../../../core/usecases/contract/createContract";
import { FormDrawer } from "../../components/FormDrawer";
import { useEntityForm } from "../../components/useEntityForm";
import { dateToIso, isoToDate, parseDisplayDate } from "../../format/date";
import { parseMoney } from "../../format/money";

interface Values {
  type: ContractType;
  projectId: string | null;
  subcontractorId: string | null;
  number: string;
  date: Date | null;
  value: string;
  description: string;
}

interface Option {
  value: string;
  label: string;
}

const byLabel = (a: Option, b: Option) => a.label.localeCompare(b.label, "en", { sensitivity: "base" });

/**
 * Create form (`contract` null; optional preset, locked project), edit form (active) or read-only view with Restore
 * (archived). Type and project are editable on create only (BR-CON-005).
 */
export function ContractForm({
  opened,
  contract,
  presetProjectId,
  onClose,
  onDone,
}: {
  opened: boolean;
  contract: ContractListItem | null;
  presetProjectId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const form = useEntityForm();
  const [values, setValues] = useState<Values>({
    type: CONTRACT_TYPE_DEFAULT,
    projectId: null,
    subcontractorId: null,
    number: "",
    date: null,
    value: "",
    description: "",
  });
  const [projects, setProjects] = useState<Option[]>([]);
  const [investorNames, setInvestorNames] = useState<Map<string, string>>(new Map());
  const [subcontractors, setSubcontractors] = useState<Option[]>([]);
  const readOnly = contract?.archivedAt != null;
  const editing = contract !== null;

  useEffect(() => {
    if (!opened) return;
    form.reset();
    setValues(
      contract
        ? {
            type: contract.type,
            projectId: contract.projectId,
            subcontractorId: contract.subcontractorId,
            number: contract.number,
            date: isoToDate(contract.date),
            value: (contract.value / 100).toFixed(2),
            description: contract.description ?? "",
          }
        : {
            type: CONTRACT_TYPE_DEFAULT,
            projectId: presetProjectId ?? null,
            subcontractorId: null,
            number: "",
            date: null,
            value: "",
            description: "",
          },
    );
    let active = true;
    // Pickers offer active records only, sorted by name (UI-002b); an edit form keeps showing the currently
    // referenced project / subcontractor even when it was archived later (BR-GEN-006).
    void Promise.all([useCases.listProjects({}), useCases.listSubcontractors({})]).then(
      ([projectResult, subcontractorResult]) => {
        if (!active || !projectResult.ok || !subcontractorResult.ok) return;
        const projectOptions = projectResult.value.map((project) => ({ value: project.id, label: project.name }));
        const names = new Map(projectResult.value.map((project) => [project.id, project.investorName]));
        const subcontractorOptions = subcontractorResult.value.map((s) => ({ value: s.id, label: s.name }));
        if (contract) {
          if (!projectOptions.some((option) => option.value === contract.projectId)) {
            projectOptions.push({ value: contract.projectId, label: contract.projectName });
          }
          if (contract.type === "INCOMING") names.set(contract.projectId, contract.counterpartyName);
          if (
            contract.subcontractorId !== null &&
            !subcontractorOptions.some((option) => option.value === contract.subcontractorId)
          ) {
            subcontractorOptions.push({ value: contract.subcontractorId, label: contract.counterpartyName });
          }
        }
        setProjects(projectOptions.sort(byLabel));
        setInvestorNames(names);
        setSubcontractors(subcontractorOptions.sort(byLabel));
      },
    );
    return () => {
      active = false;
    };
  }, [opened, contract, presetProjectId, useCases]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const submit = () => {
    let value: number | null = null;
    if (values.value.trim() !== "") {
      const parsed = parseMoney(values.value);
      // An unparseable amount is passed on as NaN so the use case reports BR-GEN-001 in form field order.
      value = parsed.ok ? parsed.value : Number.NaN;
    }
    const input = {
      type: values.type,
      projectId: values.projectId ?? "",
      subcontractorId: values.type === "OUTGOING" ? values.subcontractorId : null,
      number: values.number,
      date: values.date ? dateToIso(values.date) : "",
      value,
      description: values.description,
    };
    void form.save(
      () => (contract ? useCases.updateContract(contract.id, input) : useCases.createContract(input)),
      onDone,
    );
  };

  const title = readOnly
    ? t("entity.contract.singular")
    : editing
      ? t("entity.contract.edit")
      : t("entity.contract.new");
  const investorName = values.projectId ? (investorNames.get(values.projectId) ?? "") : "";

  return (
    <FormDrawer
      opened={opened}
      title={title}
      readOnly={readOnly}
      submitting={form.submitting}
      formError={form.formError}
      onClose={onClose}
      onSubmit={submit}
      onRestore={() => contract && void form.restore(() => useCases.restoreContract(contract.id), onDone)}
    >
      <Input.Wrapper label={t("entity.contract.type")} withAsterisk error={form.errorFor("type")}>
        <SegmentedControl
          fullWidth
          data={CONTRACT_TYPE_OPTIONS.map((type) => ({ value: type, label: t(`enum.contractType.${type}`) }))}
          value={values.type}
          onChange={(value) =>
            setValues((current) => ({
              ...current,
              type: value as ContractType,
              subcontractorId: value === "INCOMING" ? null : current.subcontractorId,
            }))
          }
          disabled={editing}
          data-testid="field-type"
        />
      </Input.Wrapper>
      <Select
        label={t("entity.contract.project")}
        withAsterisk
        data={projects}
        value={values.projectId}
        onChange={(value) => set("projectId", value)}
        searchable
        disabled={editing || presetProjectId !== undefined}
        data-testid="field-projectId"
        error={form.errorFor("projectId")}
      />
      {values.type === "OUTGOING" ? (
        <Select
          label={t("entity.contract.subcontractor")}
          withAsterisk
          data={subcontractors}
          value={values.subcontractorId}
          onChange={(value) => set("subcontractorId", value)}
          searchable
          disabled={readOnly}
          data-testid="field-subcontractorId"
          error={form.errorFor("subcontractorId")}
        />
      ) : (
        <Input.Wrapper label={t("entity.contract.investor")} error={form.errorFor("subcontractorId")}>
          <Text data-testid="field-investorName">{investorName === "" ? "—" : investorName}</Text>
        </Input.Wrapper>
      )}
      <TextInput
        label={t("entity.contract.number")}
        withAsterisk
        value={values.number}
        onChange={(event) => set("number", event.currentTarget.value)}
        disabled={readOnly}
        data-testid="field-number"
        error={form.errorFor("number")}
      />
      <DateInput
        label={t("entity.contract.date")}
        withAsterisk
        placeholder={t("common.datePlaceholder")}
        valueFormat="DD.MM.YYYY"
        dateParser={parseDisplayDate}
        value={values.date}
        onChange={(value) => set("date", value)}
        disabled={readOnly}
        data-testid="field-date"
        error={form.errorFor("date")}
      />
      <TextInput
        label={t("entity.contract.value")}
        withAsterisk
        value={values.value}
        onChange={(event) => set("value", event.currentTarget.value)}
        disabled={readOnly}
        data-testid="field-value"
        error={form.errorFor("value")}
      />
      <Textarea
        label={t("entity.contract.description")}
        value={values.description}
        onChange={(event) => set("description", event.currentTarget.value)}
        autosize
        minRows={2}
        disabled={readOnly}
        data-testid="field-description"
        error={form.errorFor("description")}
      />
    </FormDrawer>
  );
}
