// Spec: UI-050, UI-001, UI-090
import { useTranslation } from "react-i18next";
import { ScreenTitle } from "../../components/ScreenTitle";
import { InvoiceList } from "./InvoiceList";

export default function InvoicesScreen() {
  const { t } = useTranslation();
  return (
    <>
      <ScreenTitle>{t("nav.invoices")}</ScreenTitle>
      <InvoiceList />
    </>
  );
}
