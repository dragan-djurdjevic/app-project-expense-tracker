// Spec: UI-065, UI-033, AN-5, UI-002, DM-060
import { Group, Progress } from "@mantine/core";
import { useApp } from "../../app/AppProvider";
import { formatPercentValue } from "../format/percent";

/** Realisation % of budget as a progress bar plus number; red when > 100 %; "—" without a percentage. */
export function RealisationBar({ value, testId }: { value: number | null; testId: string }) {
  const { settings } = useApp();
  if (value === null) return <>—</>;
  return (
    <Group gap="xs" wrap="nowrap">
      <Progress
        value={Math.min(value, 100)}
        color={value > 100 ? "red" : "blue"}
        w={100}
        data-testid={testId}
        data-value={value}
      />
      <span>{formatPercentValue(value, settings.language)}</span>
    </Group>
  );
}
