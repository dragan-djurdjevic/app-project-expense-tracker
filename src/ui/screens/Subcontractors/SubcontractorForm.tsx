// Spec: UI-021, UI-002b, DM-020, BR-GEN-007, BR-SUB-001, UI-090
import { TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { Subcontractor } from "../../../core/domain/Subcontractor";
import { FormDrawer } from "../../components/FormDrawer";
import { useEntityForm } from "../../components/useEntityForm";

const FIELDS = ["name", "vatNumber", "industry", "contactPerson", "email", "phone"] as const;

type Values = Record<(typeof FIELDS)[number], string>;

const EMPTY: Values = {
  name: "",
  vatNumber: "",
  industry: "",
  contactPerson: "",
  email: "",
  phone: "",
};

/** Create form (`subcontractor` null), edit form (active) or read-only view with Restore (archived). */
export function SubcontractorForm({
  opened,
  subcontractor,
  onClose,
  onDone,
}: {
  opened: boolean;
  subcontractor: Subcontractor | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const form = useEntityForm();
  const [values, setValues] = useState<Values>(EMPTY);
  const readOnly = subcontractor?.archivedAt != null;

  useEffect(() => {
    if (!opened) return;
    form.reset();
    setValues(
      subcontractor
        ? {
            name: subcontractor.name,
            vatNumber: subcontractor.vatNumber,
            industry: subcontractor.industry ?? "",
            contactPerson: subcontractor.contactPerson ?? "",
            email: subcontractor.email ?? "",
            phone: subcontractor.phone ?? "",
          }
        : EMPTY,
    );
  }, [opened, subcontractor]);

  const title = readOnly
    ? t("entity.subcontractor.singular")
    : subcontractor
      ? t("entity.subcontractor.edit")
      : t("entity.subcontractor.new");

  return (
    <FormDrawer
      opened={opened}
      title={title}
      readOnly={readOnly}
      submitting={form.submitting}
      formError={form.formError}
      onClose={onClose}
      onSubmit={() =>
        void form.save(
          () =>
            subcontractor
              ? useCases.updateSubcontractor(subcontractor.id, values)
              : useCases.createSubcontractor(values),
          onDone,
        )
      }
      onRestore={() =>
        subcontractor && void form.restore(() => useCases.restoreSubcontractor(subcontractor.id), onDone)
      }
    >
      {FIELDS.map((field) => (
        <TextInput
          key={field}
          label={t(`entity.subcontractor.${field}`)}
          withAsterisk={field === "name" || field === "vatNumber"}
          value={values[field]}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setValues((current) => ({ ...current, [field]: value }));
          }}
          disabled={readOnly}
          data-testid={`field-${field}`}
          error={form.errorFor(field)}
        />
      ))}
    </FormDrawer>
  );
}
