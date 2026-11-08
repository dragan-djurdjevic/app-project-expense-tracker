// Spec: UI-002a, UI-032
import { Button, Group, Switch, TextInput } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

/** Search box, extra filters, "Show archived" toggle and "New" button (hidden when `onNew` is absent) above a list. */
export function ListToolbar({
  search,
  onSearch,
  showArchived,
  onShowArchived,
  onNew,
  children,
}: {
  search: string;
  onSearch: (value: string) => void;
  showArchived: boolean;
  onShowArchived: (value: boolean) => void;
  onNew?: () => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Group mb="md" align="flex-end">
      <TextInput
        placeholder={t("common.search")}
        aria-label={t("common.search")}
        value={search}
        onChange={(event) => onSearch(event.currentTarget.value)}
        data-testid="list-search"
      />
      {children}
      <Switch
        label={t("common.showArchived")}
        checked={showArchived}
        onChange={(event) => onShowArchived(event.currentTarget.checked)}
        data-testid="toggle-archived"
        mb={8}
      />
      {onNew && (
        <Button ml="auto" onClick={onNew} data-testid="btn-new">
          {t("common.new")}
        </Button>
      )}
    </Group>
  );
}
