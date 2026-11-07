// Spec: UI-002a, UI-032, BR-GEN-007
import { ActionIcon, Menu } from "@mantine/core";
import { useTranslation } from "react-i18next";

/** Row action menu: Edit + Archive for active rows, Restore for archived rows; optional Open (projects). */
export function RowActions({
  archived,
  onOpen,
  onEdit,
  onArchive,
  onRestore,
}: {
  archived: boolean;
  onOpen?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Menu position="bottom-end" withinPortal>
      <Menu.Target>
        <ActionIcon variant="subtle" color="gray" aria-label={t("common.actions")}>
          ⋯
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        {onOpen && <Menu.Item onClick={onOpen}>{t("common.open")}</Menu.Item>}
        {archived ? (
          <Menu.Item onClick={onRestore}>{t("common.restore")}</Menu.Item>
        ) : (
          <>
            <Menu.Item onClick={onEdit}>{t("common.edit")}</Menu.Item>
            <Menu.Item color="red" onClick={onArchive}>
              {t("common.archive")}
            </Menu.Item>
          </>
        )}
      </Menu.Dropdown>
    </Menu>
  );
}
