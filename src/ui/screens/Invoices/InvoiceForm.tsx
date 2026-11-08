// Spec: UI-051, UI-052, UI-053, UI-002, UI-002b, DM-050, BR-IVC-002, BR-IVC-005, BR-IVC-006, BR-IVC-007, BR-IVC-008, BR-GEN-006, BR-GEN-007, UI-032, UI-090
import { Alert, Input, Select, Text, TextInput, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { ContractListItem } from "../../../core/domain/Contract";
import type { InvoiceAttachmentFile, InvoiceListRow, InvoiceStatus } from "../../../core/domain/Invoice";
import type { StoredDocumentRef } from "../../../core/domain/StoredDocumentRef";
import { checkInvoiceAttachment } from "../../../core/usecases/invoice/attachInvoiceDocument";
import {
  INVOICE_STATUS_DEFAULT,
  computeInvoiceAmounts,
  invoiceStatusOptions,
} from "../../../core/usecases/invoice/createInvoice";
import { FormDrawer } from "../../components/FormDrawer";
import { useEntityForm } from "../../components/useEntityForm";
import { dateToIso, isoToDate, parseDisplayDate } from "../../format/date";
import { formatMoney, parseMoney } from "../../format/money";
import { formatVatPercent, parseVatPercent } from "../../format/vatPercent";
import { AttachmentBlock } from "./AttachmentBlock";

interface Values {
  contractId: string | null;
  number: string;
  date: Date | null;
  dueDate: Date | null;
  value: string;
  vatRate: string;
  status: InvoiceStatus;
  description: string;
}

/** Attachment state of the open form; changes take effect on Save (UI-053). */
type Attachment = { kind: "stored"; ref: StoredDocumentRef } | { kind: "chosen"; file: InvoiceAttachmentFile } | null;

const byNumber = (a: ContractListItem, b: ContractListItem) =>
  a.number.localeCompare(b.number, "en", { sensitivity: "base" });

/**
 * Create form (`invoice` null; optional fixed project), edit form (active) or read-only view with Restore
 * (archived). The contract is editable on create only (BR-IVC-002).
 */
export function InvoiceForm({
  opened,
  invoice,
  presetProjectId,
  onClose,
  onDone,
}: {
  opened: boolean;
  invoice: InvoiceListRow | null;
  presetProjectId?: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { useCases, settings } = useApp();
  const form = useEntityForm();
  const empty = (): Values => ({
    contractId: null,
    number: "",
    date: null,
    dueDate: null,
    value: "",
    vatRate: formatVatPercent(settings.defaultVatRate),
    status: INVOICE_STATUS_DEFAULT,
    description: "",
  });
  const [values, setValues] = useState<Values>(empty);
  const [attachment, setAttachment] = useState<Attachment>(null);
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const readOnly = invoice?.archivedAt != null;
  const editing = invoice !== null;
  const money = (amount: number) => formatMoney(amount, settings.currency);

  useEffect(() => {
    if (!opened) return;
    form.reset();
    setValues(
      invoice
        ? {
            contractId: invoice.contractId,
            number: invoice.number,
            date: isoToDate(invoice.date),
            dueDate: invoice.dueDate ? isoToDate(invoice.dueDate) : null,
            value: (invoice.value / 100).toFixed(2),
            vatRate: formatVatPercent(invoice.vatRate),
            status: invoice.status,
            description: invoice.description ?? "",
          }
        : empty(),
    );
    setAttachment(invoice?.attachment ? { kind: "stored", ref: invoice.attachment } : null);
    let active = true;
    // All contracts (incl. archived) for the "Invoiced so far" line of the current contract; the picker shows only
    // active ones (UI-051), in a project tab only that project's.
    void useCases.listContracts({ includeArchived: true, projectId: presetProjectId }).then((result) => {
      if (active && result.ok) setContracts([...result.value].sort(byNumber));
    });
    return () => {
      active = false;
    };
  }, [opened, invoice, presetProjectId, useCases]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const direction = (type: ContractListItem["type"]) => t(`entity.contract.typeBadge.${type}`);
  const options = contracts
    .filter((contract) => contract.archivedAt === null)
    .map((contract) => ({
      value: contract.id,
      label: t("entity.invoice.contractOption", {
        number: contract.number,
        project: contract.projectName,
        direction: direction(contract.type),
      }),
    }));
  if (invoice && !options.some((option) => option.value === invoice.contractId)) {
    options.push({
      value: invoice.contractId,
      label: t("entity.invoice.contractOption", {
        number: invoice.contractNumber,
        project: invoice.projectName,
        direction: direction(invoice.direction),
      }),
    });
  }

  const net = values.value.trim() === "" ? null : parseMoney(values.value);
  const vat = parseVatPercent(values.vatRate);
  const amounts = net?.ok && vat.ok ? computeInvoiceAmounts(net.value, vat.value) : null;

  // UI-052 / BR-IVC-008: non-cancelled sum (archived included) after saving vs. the contract value.
  const contract = contracts.find((c) => c.id === values.contractId) ?? null;
  let overInvoiced = false;
  if (contract) {
    const stored = invoice && invoice.contractId === contract.id && invoice.status !== "CANCELLED" ? invoice.value : 0;
    const saved = values.status !== "CANCELLED" && net?.ok ? net.value : 0;
    overInvoiced = contract.invoiced - stored + saved > contract.value;
  }

  const pick = (file: InvoiceAttachmentFile) => {
    const error = checkInvoiceAttachment(file);
    if (error) {
      form.showError(error);
      return;
    }
    form.reset();
    setAttachment({ kind: "chosen", file });
  };

  const submit = () => {
    let value: number | null = null;
    if (net !== null) {
      // An unparseable amount is passed on as NaN so the use case reports BR-GEN-001 in form field order.
      value = net.ok ? net.value : Number.NaN;
    }
    const input = {
      contractId: values.contractId ?? "",
      number: values.number,
      date: values.date ? dateToIso(values.date) : "",
      dueDate: values.dueDate ? dateToIso(values.dueDate) : null,
      value,
      vatRate: vat.ok ? vat.value : values.vatRate.trim() === "" ? null : Number.NaN,
      status: values.status,
      description: values.description,
    };
    void form.save(async () => {
      const saved = invoice ? await useCases.updateInvoice(invoice.id, input) : await useCases.createInvoice(input);
      if (!saved.ok) return saved;
      if (attachment?.kind === "chosen") return useCases.attachInvoiceDocument(saved.value.id, attachment.file);
      if (invoice?.attachment && attachment === null) return useCases.removeInvoiceDocument(saved.value.id);
      return saved;
    }, onDone);
  };

  const title = readOnly ? t("entity.invoice.singular") : editing ? t("entity.invoice.edit") : t("entity.invoice.new");
  const statusOptions = invoiceStatusOptions(invoice?.status ?? INVOICE_STATUS_DEFAULT).map((status) => ({
    value: status,
    label: t(`enum.invoiceStatus.${status}`),
  }));
  const attachmentName =
    attachment === null ? null : attachment.kind === "stored" ? attachment.ref.originalName : attachment.file.name;

  return (
    <FormDrawer
      opened={opened}
      title={title}
      readOnly={readOnly}
      submitting={form.submitting}
      formError={form.formError}
      onClose={onClose}
      onSubmit={submit}
      onRestore={() => invoice && void form.restore(() => useCases.restoreInvoice(invoice.id), onDone)}
    >
      <Select
        label={t("entity.invoice.contract")}
        withAsterisk
        data={options}
        value={values.contractId}
        onChange={(value) => set("contractId", value)}
        searchable
        disabled={editing}
        data-testid="field-contractId"
        error={form.errorFor("contractId")}
      />
      {contract && (
        <Text size="sm" c="dimmed" data-testid="info-invoiced">
          {t("entity.invoice.invoicedSoFar", { invoiced: money(contract.invoiced), value: money(contract.value) })}
        </Text>
      )}
      {overInvoiced && !readOnly && (
        <Alert color="yellow" data-testid="warn-over-invoiced">
          {t("entity.invoice.overInvoiced")}
        </Alert>
      )}
      <TextInput
        label={t("entity.invoice.number")}
        withAsterisk
        value={values.number}
        onChange={(event) => set("number", event.currentTarget.value)}
        disabled={readOnly}
        data-testid="field-number"
        error={form.errorFor("number")}
      />
      <DateInput
        label={t("entity.invoice.date")}
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
      <DateInput
        label={t("entity.invoice.dueDate")}
        placeholder={t("common.datePlaceholder")}
        valueFormat="DD.MM.YYYY"
        dateParser={parseDisplayDate}
        value={values.dueDate}
        onChange={(value) => set("dueDate", value)}
        clearable
        disabled={readOnly}
        data-testid="field-dueDate"
        error={form.errorFor("dueDate")}
      />
      <TextInput
        label={t("entity.invoice.value")}
        withAsterisk
        value={values.value}
        onChange={(event) => set("value", event.currentTarget.value)}
        disabled={readOnly}
        data-testid="field-value"
        error={form.errorFor("value")}
      />
      <TextInput
        label={t("entity.invoice.vatRate")}
        withAsterisk
        value={values.vatRate}
        onChange={(event) => set("vatRate", event.currentTarget.value)}
        disabled={readOnly}
        data-testid="field-vatRate"
        error={form.errorFor("vatRate")}
      />
      <Input.Wrapper label={t("entity.invoice.vatAmount")}>
        <Text data-testid="field-vatAmount">{amounts ? money(amounts.vatAmount) : "—"}</Text>
      </Input.Wrapper>
      <Input.Wrapper label={t("entity.invoice.gross")}>
        <Text data-testid="field-gross">{amounts ? money(amounts.gross) : "—"}</Text>
      </Input.Wrapper>
      <Select
        label={t("entity.invoice.status")}
        withAsterisk
        data={statusOptions}
        value={values.status}
        onChange={(value) => value && set("status", value as InvoiceStatus)}
        allowDeselect={false}
        disabled={readOnly}
        data-testid="field-status"
        error={form.errorFor("status")}
      />
      <Textarea
        label={t("entity.invoice.description")}
        value={values.description}
        onChange={(event) => set("description", event.currentTarget.value)}
        autosize
        minRows={2}
        disabled={readOnly}
        data-testid="field-description"
        error={form.errorFor("description")}
      />
      <AttachmentBlock
        name={attachmentName}
        readOnly={readOnly}
        error={form.errorFor("attachment")}
        onPick={pick}
        onOpen={() => {
          if (invoice && attachment?.kind === "stored") void useCases.openInvoiceDocument(invoice.id);
        }}
        onRemove={() => setAttachment(null)}
      />
    </FormDrawer>
  );
}
