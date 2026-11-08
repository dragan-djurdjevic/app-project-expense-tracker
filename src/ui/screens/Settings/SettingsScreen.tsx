// Spec: UI-080, DM-060, UI-002, UI-002b, UI-090
import { Alert, Button, Group, Select, Stack, Text, TextInput } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { DomainError } from "../../../core/domain/DomainError";
import { SUPPORTED_CURRENCIES, SUPPORTED_LANGUAGES } from "../../../core/usecases/settings/updateSettings";
import { ScreenTitle } from "../../components/ScreenTitle";
import { formatVatPercent, parseVatPercent } from "../../format/vatPercent";
import { applyLanguage } from "../../i18n";

type FieldErrors = Partial<Record<"currency" | "defaultVatRate" | "language", string>>;

function PathRow({ label, path, onOpen }: { label: string; path: string; onOpen: (() => void) | null }) {
  const { t } = useTranslation();
  return (
    <Stack gap={4}>
      <Text fw={500} size="sm">
        {label}
      </Text>
      <Group gap="sm">
        <Text size="sm" ff="monospace">
          {path}
        </Text>
        {onOpen && (
          <Button variant="light" size="xs" onClick={onOpen}>
            {t("settings.openFolder")}
          </Button>
        )}
      </Group>
    </Stack>
  );
}

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { useCases, runtime, setSettings } = useApp();
  const [currency, setCurrency] = useState<string | null>(null);
  const [language, setLanguage] = useState<string | null>(null);
  const [vatPercent, setVatPercent] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    void useCases.getSettings().then((result) => {
      if (active && result.ok) {
        setCurrency(result.value.currency);
        setVatPercent(formatVatPercent(result.value.defaultVatRate, result.value.language));
        setLanguage(result.value.language);
      }
    });
    return () => {
      active = false;
    };
  }, [useCases]);

  const showError = (error: DomainError) => {
    if (error.field === "currency" || error.field === "defaultVatRate" || error.field === "language") {
      setFieldErrors({ [error.field]: t(error.messageKey) });
    } else {
      setFormError(t(error.messageKey));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFieldErrors({});
    setFormError(null);
    const vat = parseVatPercent(vatPercent);
    if (!vat.ok) {
      setFieldErrors({ defaultVatRate: t(vat.error.messageKey) });
      return;
    }
    setSubmitting(true);
    try {
      const result = await useCases.updateSettings({
        currency: currency ?? "",
        defaultVatRate: vat.value,
        language: language ?? "",
      });
      if (result.ok) {
        await applyLanguage(result.value.language);
        setSettings(result.value);
        setVatPercent(formatVatPercent(result.value.defaultVatRate, result.value.language));
        notifications.show({ message: i18n.t("common.saved"), color: "green" });
      } else {
        showError(result.error);
      }
    } catch (error) {
      setFormError(t("errors.unexpected", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setSubmitting(false);
    }
  };

  const openFolder = runtime.openFolder;
  const inMemory = t("settings.inMemory");

  return (
    <>
      <ScreenTitle>{t("nav.settings")}</ScreenTitle>
      <form onSubmit={onSubmit}>
        <Stack maw={480}>
          {formError && (
            <Alert color="red" data-testid="form-error">
              {formError}
            </Alert>
          )}
          <Select
            label={t("settings.currency")}
            data={[...SUPPORTED_CURRENCIES]}
            value={currency}
            onChange={setCurrency}
            allowDeselect={false}
            data-testid="field-currency"
            error={fieldErrors.currency && <span data-testid="error-currency">{fieldErrors.currency}</span>}
          />
          <TextInput
            label={t("settings.defaultVatRate")}
            value={vatPercent}
            onChange={(event) => setVatPercent(event.currentTarget.value)}
            data-testid="field-defaultVatRate"
            error={
              fieldErrors.defaultVatRate && <span data-testid="error-defaultVatRate">{fieldErrors.defaultVatRate}</span>
            }
          />
          <Select
            label={t("settings.language")}
            data={SUPPORTED_LANGUAGES.map((value) => ({ value, label: t(`settings.languageOption.${value}`) }))}
            value={language}
            onChange={setLanguage}
            allowDeselect={false}
            data-testid="field-language"
            error={fieldErrors.language && <span data-testid="error-language">{fieldErrors.language}</span>}
          />
          <Group>
            <Button type="submit" loading={submitting} disabled={submitting} data-testid="btn-save">
              {t("common.save")}
            </Button>
          </Group>
          <PathRow label={t("settings.dbPath")} path={runtime.dbPath ?? inMemory} onOpen={null} />
          <PathRow
            label={t("settings.documentsPath")}
            path={runtime.documentsPath ?? inMemory}
            onOpen={openFolder && runtime.documentsPath ? () => void openFolder(runtime.documentsPath as string) : null}
          />
        </Stack>
      </form>
    </>
  );
}
