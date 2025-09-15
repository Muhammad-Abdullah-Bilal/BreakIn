// formatter: date/number formatting
export function formatDate(date: string) {
  return new Date(date).toLocaleDateString();
}
