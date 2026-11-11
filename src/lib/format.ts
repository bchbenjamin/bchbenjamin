const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** "2024-03" -> "Mar 2024". */
export function formatMonth(month: string): string {
  const match = MONTH_PATTERN.exec(month);
  if (!match) throw new Error(`Unsupported month value: ${month}`);
  const year = match[1];
  const monthIndex = Number(match[2]) - 1;
  return `${MONTH_NAMES[monthIndex]} ${year}`;
}

/** "2022-08", null -> "Aug 2022 — Present". */
export function formatRange(startDate: string, endDate: string | null): string {
  return `${formatMonth(startDate)} — ${endDate ? formatMonth(endDate) : "Present"}`;
}
