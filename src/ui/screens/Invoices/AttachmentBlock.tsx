// Spec: UI-053, BR-IVC-006, DS-004, UI-090
import { Anchor, Button, Group, Input } from "@mantine/core";
import { useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../../app/AppProvider";
import type { InvoiceAttachmentFile } from "../../../core/domain/Invoice";
import { ConfirmDialog } from "../../components/ConfirmDialog";

/**
 * Attachment block (UI-053): "Attach PDF" without attachment; file name link, "Replace" and "Remove" (with confirm)
 * with one. Tauri mode uses the native PDF dialog, browser mode the hidden `input-attach`.
 */
export function AttachmentBlock({
  name,
  readOnly,
  error,
  onPick,
  onOpen,
  onRemove,
}: {
  /** File name of the current (stored or chosen) attachment; null = none. */
  name: string | null;
  readOnly: boolean;
  error: ReactNode;
  onPick: (file: InvoiceAttachmentFile) => void;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation();
  const { runtime } = useApp();
  const input = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);

  const choose = async () => {
    if (runtime.pickPdf) {
      const file = await runtime.pickPdf();
      if (file) onPick(file);
    } else {
      input.current?.click();
    }
  };

  return (
    <Input.Wrapper label={t("entity.invoice.attachment")} error={error}>
      <Group gap="sm" mt={4}>
        {name !== null && (
          <Anchor component="button" type="button" onClick={onOpen} data-testid="link-attachment">
            {name}
          </Anchor>
        )}
        {!readOnly &&
          (name === null ? (
            <Button variant="default" size="xs" onClick={() => void choose()} data-testid="btn-attach">
              {t("entity.invoice.attach")}
            </Button>
          ) : (
            <>
              <Button variant="default" size="xs" onClick={() => void choose()} data-testid="btn-replace">
                {t("entity.invoice.replace")}
              </Button>
              <Button
                variant="default"
                color="red"
                size="xs"
                onClick={() => setConfirming(true)}
                data-testid="btn-remove-attachment"
              >
                {t("entity.invoice.remove")}
              </Button>
            </>
          ))}
      </Group>
      {!readOnly && runtime.pickPdf === null && (
        <input
          ref={input}
          type="file"
          accept=".pdf,application/pdf"
          hidden
          data-testid="input-attach"
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file)
              void file.arrayBuffer().then((buffer) => onPick({ name: file.name, bytes: new Uint8Array(buffer) }));
          }}
        />
      )}
      <ConfirmDialog
        opened={confirming}
        title={t("entity.invoice.confirmRemove.title")}
        message={t("entity.invoice.confirmRemove.message", { name: name ?? "" })}
        confirmLabel={t("entity.invoice.remove")}
        testId="confirm-remove-attachment"
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
      />
    </Input.Wrapper>
  );
}
