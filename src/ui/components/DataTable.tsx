// Spec: UI-002a, BR-GEN-007, UI-002, DM-060
import { Badge, Group, Table, Text, UnstyledButton } from "@mantine/core";
import { useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useApp } from "../../app/AppProvider";
import type { Language } from "../../core/domain/Settings";
import { compareText } from "../format/locale";

export type SortValue = string | number | null;

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  /** Value used for sorting; null values always sort last. */
  sortValue: (row: T) => SortValue;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

interface Row {
  id: string;
  archivedAt: string | null;
}

function compare(a: SortValue, b: SortValue, language: Language): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return compareText(String(a), String(b), language);
}

/**
 * Sortable table (click a header toggles asc/desc). Archived rows are greyed with an "Archived" badge in the first
 * column; every row has `data-testid="row-<id>"`.
 */
export function DataTable<T extends Row>({
  rows,
  columns,
  defaultSort,
  onRowClick,
  actions,
  emptyText,
}: {
  rows: T[];
  columns: Column<T>[];
  defaultSort: SortState;
  onRowClick: (row: T) => void;
  actions: (row: T) => ReactNode;
  emptyText: string;
}) {
  const { t } = useTranslation();
  const { settings } = useApp();
  const [sort, setSort] = useState<SortState>(defaultSort);

  const sorted = useMemo(() => {
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return rows;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...rows].sort((left, right) => {
      const a = column.sortValue(left);
      const b = column.sortValue(right);
      if (a === null && b === null) return 0;
      if (a === null) return 1;
      if (b === null) return -1;
      return factor * compare(a, b, settings.language);
    });
  }, [rows, columns, sort, settings.language]);

  const toggle = (key: string) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );

  return (
    <Table highlightOnHover striped={false}>
      <Table.Thead>
        <Table.Tr>
          {columns.map((column) => (
            <Table.Th key={column.key}>
              <UnstyledButton onClick={() => toggle(column.key)}>
                <Group gap={4} wrap="nowrap">
                  <Text fw={600} size="sm">
                    {column.label}
                  </Text>
                  {sort.key === column.key && <Text size="xs">{sort.direction === "asc" ? "▲" : "▼"}</Text>}
                </Group>
              </UnstyledButton>
            </Table.Th>
          ))}
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {sorted.length === 0 ? (
          <Table.Tr>
            <Table.Td colSpan={columns.length + 1}>
              <Text c="dimmed">{emptyText}</Text>
            </Table.Td>
          </Table.Tr>
        ) : (
          sorted.map((row) => {
            const archived = row.archivedAt !== null;
            return (
              <Table.Tr
                key={row.id}
                data-testid={`row-${row.id}`}
                onClick={() => onRowClick(row)}
                style={{ cursor: "pointer", opacity: archived ? 0.55 : 1 }}
              >
                {columns.map((column, index) => (
                  <Table.Td key={column.key}>
                    {index === 0 && archived ? (
                      <Group gap="xs" wrap="nowrap">
                        {column.render(row)}
                        <Badge color="gray" variant="light" size="sm">
                          {t("common.archived")}
                        </Badge>
                      </Group>
                    ) : (
                      column.render(row)
                    )}
                  </Table.Td>
                ))}
                <Table.Td onClick={(event) => event.stopPropagation()} style={{ width: 48 }}>
                  {actions(row)}
                </Table.Td>
              </Table.Tr>
            );
          })
        )}
      </Table.Tbody>
    </Table>
  );
}
