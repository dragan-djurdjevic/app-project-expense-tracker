// Spec: UI-002a, UI-053
import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";

/** Archive confirmation (`data-testid="confirm-archive"`). */
export function ConfirmArchiveDialog({
  name,
  onConfirm,
  onCancel,
}: {
  /** Name of the record to archive; null = dialog closed. */
  name: string | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal opened={name !== null} onClose={onCancel} title={t("common.confirmArchive.title")} centered>
      <Stack data-testid="confirm-archive">
        <Text>{t("common.confirmArchive.message", { name: name ?? "" })}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button color="red" loading={busy} onClick={() => void confirm()}>
            {t("common.archive")}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}

/** Generic confirmation (e.g. `confirm-remove-attachment`, UI-053). */
export function ConfirmDialog({
  opened,
  title,
  message,
  confirmLabel,
  testId,
  onConfirm,
  onCancel,
}: {
  opened: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  testId: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Modal opened={opened} onClose={onCancel} title={title} centered>
      <Stack data-testid={testId}>
        <Text>{message}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Button color="red" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
