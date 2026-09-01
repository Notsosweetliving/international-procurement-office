const SYMBOLS: Record<string, string> = {
  EUR: "€",
  GBP: "£",
  USD: "$",
  CHF: "CHF ",
  DKK: "DKK ",
  SEK: "SEK ",
  NOK: "NOK ",
  PLN: "PLN ",
};
export function formatCurrency(
  value: number | null | undefined,
  currency: string | null | undefined,
) {
  if (value == null || !Number.isFinite(value)) return "Value not disclosed";
  if (!currency)
    return (
      new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value) + " (currency not disclosed)"
    );
  const amount =
    value >= 1e6
      ? (value / 1e6).toFixed(value % 1e6 === 0 ? 0 : 1) + "M"
      : value >= 1e3
        ? (value / 1e3).toFixed(value % 1e3 === 0 ? 0 : 1) + "K"
        : new Intl.NumberFormat("en").format(value);
  return (SYMBOLS[currency] ?? currency + " ") + amount;
}
export function formatDate(
  value: string | null | undefined,
  fallback = "Not disclosed",
) {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? fallback
    : new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date);
}
export function deadlineStatus(
  value: string | null | undefined,
  now = new Date(),
) {
  if (!value) return { label: "Deadline not disclosed", days: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    return { label: "Deadline not disclosed", days: null };
  const days = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  return days < 0
    ? { label: "Closed", days }
    : { label: days === 0 ? "Closes today" : `${days} days remaining`, days };
}
