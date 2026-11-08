// Spec: UI-040, UI-001, UI-090
import { useTranslation } from "react-i18next";
import { ScreenTitle } from "../../components/ScreenTitle";
import { ContractList } from "./ContractList";

export default function ContractsScreen() {
  const { t } = useTranslation();
  return (
    <>
      <ScreenTitle>{t("nav.contracts")}</ScreenTitle>
      <ContractList />
    </>
  );
}
