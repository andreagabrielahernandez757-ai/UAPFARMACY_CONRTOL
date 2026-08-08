import type { Delivery } from "@/lib/deliveries";

export type RangePreset = "today" | "yesterday" | "7d" | "30d" | "all" | "custom";

export type RangeValue = {
  preset: RangePreset;
  from: string; // yyyy-mm-dd
  to: string; // yyyy-mm-dd
  fromTime: string; // HH:mm
  toTime: string; // HH:mm
};

export const RANGE_LABELS: Record<RangePreset, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  all: "Todo el historial",
  custom: "Rango personalizado",
};

export const defaultRange: RangeValue = {
  preset: "today",
  from: "",
  to: "",
  fromTime: "00:00",
  toTime: "23:59",
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function parseLocal(date: string, time: string): number | null {
  if (!date) return null;
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "00:00").split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh ?? 0, mm ?? 0, 0, 0).getTime();
}

export function rangeBounds(
  v: RangeValue,
  now: number,
): { start: number | null; end: number | null } {
  const base = now > 0 ? new Date(now) : new Date();
  const today = startOfDay(base).getTime();
  const day = 86400000;
  switch (v.preset) {
    case "today":
      return { start: today, end: today + day };
    case "yesterday":
      return { start: today - day, end: today };
    case "7d":
      return { start: today - 6 * day, end: today + day };
    case "30d":
      return { start: today - 29 * day, end: today + day };
    case "all":
      return { start: null, end: null };
    case "custom": {
      const start = parseLocal(v.from, v.fromTime);
      const endBase = parseLocal(v.to, v.toTime);
      return { start, end: endBase !== null ? endBase + 60000 : null };
    }
  }
}

export function filterByRange(rows: Delivery[], v: RangeValue, now: number): Delivery[] {
  const { start, end } = rangeBounds(v, now);
  if (start === null && end === null) return rows;
  return rows.filter((r) => {
    const t = new Date(r.started_at).getTime();
    if (start !== null && t < start) return false;
    if (end !== null && t >= end) return false;
    return true;
  });
}
