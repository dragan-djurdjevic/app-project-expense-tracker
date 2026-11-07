// Spec: UI-002b, UI-002a, BR-GEN-007
import { Alert, Button, Drawer, Group, Stack } from "@mantine/core";
import type { FormEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";

/**
 * Right-side drawer for create/edit forms (Save + Cancel) and for the read-only view of archived records
 * (Restore only). Errors without a field are shown at the top (`form-error`).
 */
export function FormDrawer({
  opened,
  title,
  readOnly,
  submitting,
  formError,
  onSubmit,
  onRestore,
  onClose,
  children,
}: {
  opened: boolean;
  title: string;
  readOnly: boolean;
  submitting: boolean;
  formError: string | null;
  onSubmit: () => void;
  onRestore: () => void;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!readOnly) onSubmit();
  };
  return (
    <Drawer opened={opened} onClose={onClose} position="right" title={title} size="md">
      <form onSubmit={submit}>
        <Stack>
          {formError && (
            <Alert color="red" data-testid="form-error">
              {formError}
            </Alert>
          )}
          {children}
          <Group justify="flex-end">
            {readOnly ? (
              <Button onClick={onRestore} loading={submitting} disabled={submitting}>
                {t("common.restore")}
              </Button>
            ) : (
              <>
                <Button variant="default" onClick={onClose} data-testid="btn-cancel">
                  {t("common.cancel")}
                </Button>
                <Button type="submit" loading={submitting} disabled={submitting} data-testid="btn-save">
                  {t("common.save")}
                </Button>
              </>
            )}
          </Group>
        </Stack>
      </form>
    </Drawer>
  );
}
