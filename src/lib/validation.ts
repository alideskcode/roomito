export function text(value: FormDataEntryValue | null, max = 500): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, "").slice(0, max);
}

export function titleCaseArea(value: string): string {
  const acronyms = new Set(["GEU", "ISBT"]);
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[A-Za-z]+/g, (word) => {
      const upper = word.toUpperCase();
      return acronyms.has(upper) ? upper : `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`;
    });
}

export function passwordValue(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}

export function digits(value: string, length = 10): boolean {
  return new RegExp(`^\\d{${length}}$`).test(value);
}

export function safeInteger(value: string, minimum = 0): number | null {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= minimum ? number : null;
}

export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function validPassword(value: string): boolean {
  return value.length >= 10 && value.length <= 72 && Buffer.byteLength(value, "utf8") <= 72;
}

export function validDate(value: string): boolean {
  if (!value) return true;
  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
