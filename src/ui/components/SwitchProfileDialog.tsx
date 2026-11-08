// Spec: UI-081, UI-003, AR-013
import { notifications } from "@mantine/notifications";
import { useTranslation } from "react-i18next";
import { useApp } from "../../app/AppProvider";
import type { Profile } from "../../app/profile";
import { ConfirmDialog } from "./ConfirmDialog";

/** UI-081: confirm modal `confirm-switch-profile`; confirm → `runtime.switchProfile(target)`. */
export function SwitchProfileDialog({ target, onCancel }: { target: Profile | null; onCancel: () => void }) {
  const { t } = useTranslation();
  const { runtime } = useApp();
  const texts = target === "live" ? "settings.demo.switchToLive" : "settings.demo.switchToDemo";
  const confirm = () => {
    if (target === null) return;
    runtime.switchProfile(target).catch((error: unknown) => {
      notifications.show({
        color: "red",
        message: t("errors.unexpected", { message: error instanceof Error ? error.message : String(error) }),
      });
    });
  };
  return (
    <ConfirmDialog
      opened={target !== null}
      title={t(`${texts}.title`)}
      message={t(`${texts}.message`)}
      confirmLabel={t(`${texts}.confirm`)}
      confirmColor="blue"
      testId="confirm-switch-profile"
      confirmTestId="btn-confirm-switch"
      onConfirm={confirm}
      onCancel={onCancel}
    />
  );
}
