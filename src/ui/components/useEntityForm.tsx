// Spec: UI-002b, AR-005
import { notifications } from "@mantine/notifications";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { DomainError } from "../../core/domain/DomainError";
import type { Result } from "../../core/domain/Result";

/**
 * Form submission state: maps a use case DomainError to the matching field (`error-<field>`) or to the form-level
 * alert, disables Save while submitting and shows the "Saved" toast on success.
 */
export function useEntityForm() {
  const { t } = useTranslation();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setFieldErrors({});
    setFormError(null);
  };

  const showError = (error: DomainError) => {
    if (error.field) setFieldErrors({ [error.field]: t(error.messageKey) });
    else setFormError(t(error.messageKey));
  };

  const run = async <T,>(action: () => Promise<Result<T>>, onSuccess: () => void, toast: boolean) => {
    reset();
    setSubmitting(true);
    try {
      const result = await action();
      if (result.ok) {
        if (toast) notifications.show({ message: t("common.saved"), color: "green" });
        onSuccess();
      } else {
        showError(result.error);
      }
    } catch (error) {
      setFormError(t("errors.unexpected", { message: error instanceof Error ? error.message : String(error) }));
    } finally {
      setSubmitting(false);
    }
  };

  /** Error element for a field's `error` prop. */
  const errorFor = (field: string): ReactNode =>
    fieldErrors[field] ? <span data-testid={`error-${field}`}>{fieldErrors[field]}</span> : undefined;

  return {
    formError,
    submitting,
    reset,
    showError,
    errorFor,
    /** Runs a save use case; on success shows the "Saved" toast and calls onSuccess. */
    save: <T,>(action: () => Promise<Result<T>>, onSuccess: () => void) => run(action, onSuccess, true),
    /** Runs a restore use case; on success calls onSuccess. */
    restore: <T,>(action: () => Promise<Result<T>>, onSuccess: () => void) => run(action, onSuccess, false),
  };
}
