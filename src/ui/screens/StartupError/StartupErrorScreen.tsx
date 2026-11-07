// Spec: AR-010, UI-090
import { Alert, Center, Code, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

export default function StartupErrorScreen({ message, dbPath }: { message: string; dbPath: string | null }) {
  const { t } = useTranslation();
  return (
    <Center h="100vh" p="xl">
      <Stack maw={720}>
        <Alert color="red" title={t("common.startupError.title")} data-testid="startup-error">
          <Text>{message}</Text>
        </Alert>
        {dbPath && (
          <Text size="sm">
            {t("common.startupError.dbPath")}: <Code>{dbPath}</Code>
          </Text>
        )}
      </Stack>
    </Center>
  );
}
