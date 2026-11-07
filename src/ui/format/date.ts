// Spec: UI-002
/** Formats an ISO `YYYY-MM-DD` date as `DD.MM.YYYY`. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}.${month}.${year}`;
}
