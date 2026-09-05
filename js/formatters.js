export const UNITS = {
  raw: { divisor: 1, suffix: "" },
  thousands: { divisor: 1_000, suffix: " K" },
  lakhs: { divisor: 100_000, suffix: " L" },
  crores: { divisor: 10_000_000, suffix: " Cr" },
};

export function formatINR(value, unit = "crores", digits = 2) {
  const number = Number(value || 0);
  const config = UNITS[unit] || UNITS.crores;
  return `₹${(number / config.divisor).toLocaleString("en-IN", { maximumFractionDigits: digits, minimumFractionDigits: digits })}${config.suffix}`;
}

export function formatInteger(value) { return Number(value || 0).toLocaleString("en-IN"); }
export function formatTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Unavailable" : date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}