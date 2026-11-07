// Spec: UI-001, UI-090
import { Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { ScreenTitle } from "../../components/ScreenTitle";

export default function PlaceholderScreen({ titleKey, milestone }: { titleKey: string; milestone: string }) {
  const { t } = useTranslation();
  return (
    <>
      <ScreenTitle>{t(titleKey)}</ScreenTitle>
      <Text c="dimmed">{t("common.comingIn", { milestone })}</Text>
    </>
  );
}
