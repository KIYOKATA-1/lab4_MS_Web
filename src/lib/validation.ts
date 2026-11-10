export class InvalidResponseError extends Error {
  constructor() {
    super("The service returned an invalid response. Please try again.");
    this.name = "InvalidResponseError";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new InvalidResponseError();
  return value;
}

export function optionalRecord(value: unknown): Record<string, unknown> {
  return value === null || value === undefined ? {} : record(value);
}

export function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new InvalidResponseError();
  return value.trim() || null;
}

export function numeric(
  value: unknown,
  min = -Infinity,
  max = Infinity,
): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number") throw new InvalidResponseError();
  return Number.isFinite(value) && value >= min && value <= max ? value : null;
}

export function requiredNumber(
  value: unknown,
  min = -Infinity,
  max = Infinity,
): number {
  const number = numeric(value, min, max);
  if (number === null) throw new InvalidResponseError();
  return number;
}

export function timeZone(value: unknown): string | null {
  const zone = text(value);
  if (!zone) return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone: zone }).format(0);
    return zone;
  } catch {
    throw new InvalidResponseError();
  }
}

export function timestamps(value: unknown): number[] {
  if (value === null || value === undefined) return [];
  if (!Array.isArray(value)) throw new InvalidResponseError();
  return value.map((entry) => requiredNumber(entry, 0));
}

export function series(
  value: unknown,
  length: number,
  min = -Infinity,
): (number | null)[] {
  if (value === null || value === undefined)
    return Array.from({ length }, () => null);
  if (!Array.isArray(value) || value.length !== length)
    throw new InvalidResponseError();
  return value.map((entry) => numeric(entry, min));
}
