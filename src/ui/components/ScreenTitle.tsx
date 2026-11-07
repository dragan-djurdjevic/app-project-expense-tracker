// Spec: UI-001
import { Title } from "@mantine/core";

export function ScreenTitle({ children }: { children: string }) {
  return (
    <Title order={2} mb="md" data-testid="screen-title">
      {children}
    </Title>
  );
}
