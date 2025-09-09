export type RowObject = Record<string, unknown> | unknown[] | null | undefined;

export function parseRowValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    if ((value as any).type === "Buffer" && Array.isArray((value as any).data)) {
      // Special case for Buffer objects
      return `0x${(value as any).data.map((b: number) => b.toString(16).padStart(2, "0")).join("")}`;
    }
    return JSON.stringify(value);
  }
  return String(value);
}

export function computeColumns(rows: RowObject[] | undefined | null): string[] {
  const data = rows || [];
  if (!data.length) return [];
  const first = data[0] as RowObject;
  if (Array.isArray(first)) {
    return first.map((_, i) => String(i));
  }
  if (first && typeof first === "object") {
    const set = new Set<string>();
    for (const r of data) {
      if (r && typeof r === "object" && !Array.isArray(r)) {
        Object.keys(r as Record<string, unknown>).forEach((k) => set.add(k));
      }
    }
    return Array.from(set);
  }
  return [];
}

export const formatNumber = (n?: number) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "-";

