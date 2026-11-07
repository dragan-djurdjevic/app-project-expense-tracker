// Spec: UI-011, UI-002b, DM-010, BR-GEN-007, BR-INV-001, UI-090
import { TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { Investor } from "../../../core/domain/Investor";
import { FormDrawer } from "../../components/FormDrawer";
import { useEntityForm } from "../../components/useEntityForm";

const FIELDS = ["name", "vatNumber", "contactPerson", "email", "phone"] as const;

type Values = Record<(typeof FIELDS)[number], string>;

const EMPTY: Values = { name: "", vatNumber: "", contactPerson: "", email: "", phone: "" };

/** Create form (`investor` null), edit form (active) or read-only view with Restore (archived). */
export function InvestorForm({
  opened,
  investor,
  onClose,
  onDone,
}: {
  opened: boolean;
  investor: Investor | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { useCases } = useApp();
  const form = useEntityForm();
  const [values, setValues] = useState<Values>(EMPTY);
  const readOnly = investor?.archivedAt != null;

  useEffect(() => {
    if (!opened) return;
    form.reset();
    setValues(
      investor
        ? {
            name: investor.name,
            vatNumber: investor.vatNumber,
            contactPerson: investor.contactPerson ?? "",
            email: investor.email ?? "",
            phone: investor.phone ?? "",
          }
        : EMPTY,
    );
  }, [opened, investor]);

  const title = readOnly
    ? t("entity.investor.singular")
    : investor
      ? t("entity.investor.edit")
      : t("entity.investor.new");

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
          () => (investor ? useCases.updateInvestor(investor.id, values) : useCases.createInvestor(values)),
          onDone,
        )
      }
      onRestore={() => investor && void form.restore(() => useCases.restoreInvestor(investor.id), onDone)}
    >
      {FIELDS.map((field) => (
        <TextInput
          key={field}
          label={t(`entity.investor.${field}`)}
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
