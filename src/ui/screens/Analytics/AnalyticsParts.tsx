// Spec: UI-060, UI-002, AN-000, DM-060
import { Anchor, Badge, Group, Switch, Table, Text } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useApp } from "../../../app/AppProvider";
import { formatMoney } from "../../format/money";
import { formatPercentValue } from "../../format/percent";

/** Net/Gross toggle (`toggle-gross`), default Net (UI-060). */
export function GrossToggle({ gross, onChange }: { gross: boolean; onChange: (gross: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <Switch
      label={t("analytics.gross")}
      checked={gross}
      onChange={(event) => onChange(event.currentTarget.checked)}
      data-testid="toggle-gross"
      mb={8}
    />
  );
}

/** Project name linking to UI-032, with an "Archived" badge for archived projects (AN-000a). */
export function ProjectCell({ id, name, archived }: { id: string; name: string; archived: boolean }) {
  const { t } = useTranslation();
  return (
    <Group gap="xs" wrap="nowrap">
      <Anchor component={Link} to={`/projects/${id}`} data-testid={`link-project-${id}`}>
        {name}
      </Anchor>
      {archived && (
        <Badge color="gray" variant="light" size="sm">
          {t("common.archived")}
        </Badge>
      )}
    </Group>
  );
}

/** Money in the settings currency; negative values in red; null → "—". */
export function MoneyText({ value }: { value: number | null }) {
  const { settings } = useApp();
  if (value === null) return <>—</>;
  const text = formatMoney(value, settings.currency, settings.language);
  return value < 0 ? (
    <Text c="red" span inherit>
      {text}
    </Text>
  ) : (
    <>{text}</>
  );
}

export function PercentText({ value }: { value: number | null }) {
  const { settings } = useApp();
  return <>{formatPercentValue(value, settings.language)}</>;
}

/** Analytics table with header labels, body rows and a footer row (`table-footer`, UI-060). */
export function AnalyticsTable({
  headers,
  children,
  footer,
}: {
  headers: string[];
  children: ReactNode;
  footer: ReactNode[];
}) {
  return (
    <Table withTableBorder>
      <Table.Thead>
        <Table.Tr>
          {headers.map((header) => (
            <Table.Th key={header}>{header}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{children}</Table.Tbody>
      <Table.Tfoot>
        <Table.Tr data-testid="table-footer" fw={700}>
          {footer.map((cell, index) => (
            <Table.Td key={index}>{cell}</Table.Td>
          ))}
        </Table.Tr>
      </Table.Tfoot>
    </Table>
  );
}
