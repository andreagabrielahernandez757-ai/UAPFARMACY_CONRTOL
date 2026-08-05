import { useMemo } from "react";
import {
  LATE_MINUTES,
  PHARMACY_LABELS,
  elapsedMinutes,
  formatClock,
  type Delivery,
  type Pharmacy,
} from "@/lib/deliveries";

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "ok" | "warn" | "late";
}) {
  const toneClass =
    tone === "ok"
      ? "text-ok"
      : tone === "warn"
        ? "text-warn"
        : tone === "late"
          ? "text-late"
          : "text-primary";
  return (
    <div className="board-panel rounded-xl p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={`tabular mt-2 text-3xl font-bold lg:text-4xl ${toneClass}`}>{value}</p>
    </div>
  );
}

export function StatsPanel({ rows, now }: { rows: Delivery[]; now: number }) {
  const stats = useMemo(() => {
    const done = rows.filter((r) => r.delivered_at);
    const waiting = rows.filter((r) => !r.delivered_at);
    const times = done.map((r) => r.total_minutes ?? elapsedMinutes(r, now));
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const max = times.length ? Math.max(...times) : 0;
    const min = times.length ? Math.min(...times) : 0;
    const outOfTime =
      done.filter((r) => (r.total_minutes ?? 0) >= LATE_MINUTES).length +
      waiting.filter((r) => elapsedMinutes(r, now) >= LATE_MINUTES).length;

    const byPharmacy = (Object.keys(PHARMACY_LABELS) as Pharmacy[]).map((p) => {
      const d = done.filter((r) => r.pharmacy === p);
      const t = d.map((r) => r.total_minutes ?? 0);
      return {
        pharmacy: p,
        waiting: waiting.filter((r) => r.pharmacy === p).length,
        done: d.length,
        avg: t.length ? t.reduce((a, b) => a + b, 0) / t.length : 0,
        late: d.filter((x) => (x.total_minutes ?? 0) >= LATE_MINUTES).length,
      };
    });

    const byDayMap = new Map<string, { done: number; sum: number; late: number }>();
    for (const r of done) {
      const key = new Date(r.started_at).toLocaleDateString("es-SV");
      const cur = byDayMap.get(key) ?? { done: 0, sum: 0, late: 0 };
      cur.done += 1;
      cur.sum += r.total_minutes ?? 0;
      if ((r.total_minutes ?? 0) >= LATE_MINUTES) cur.late += 1;
      byDayMap.set(key, cur);
    }
    const byDay = [...byDayMap.entries()].slice(0, 7);

    return { done: done.length, waiting: waiting.length, avg, max, min, outOfTime, byPharmacy, byDay };
  }, [rows, now]);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-bold uppercase tracking-widest text-primary">
        Estadísticas
      </h2>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <Metric label="Atendidos" value={String(stats.done)} tone="ok" />
        <Metric label="En espera" value={String(stats.waiting)} tone="warn" />
        <Metric label="Promedio" value={formatClock(stats.avg)} />
        <Metric label="Tiempo máximo" value={formatClock(stats.max)} tone="late" />
        <Metric label="Tiempo mínimo" value={formatClock(stats.min)} tone="ok" />
        <Metric label="Fuera de tiempo" value={String(stats.outOfTime)} tone="late" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="board-panel rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Por farmacia
          </h3>
          <ul className="mt-3 space-y-3">
            {stats.byPharmacy.map((p) => (
              <li
                key={p.pharmacy}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <span className="min-w-0 truncate text-lg font-semibold uppercase">
                  {PHARMACY_LABELS[p.pharmacy]}
                </span>
                <span className="tabular shrink-0 text-sm text-muted-foreground">
                  <span className="text-ok">{p.done}</span> atend. ·{" "}
                  <span className="text-warn">{p.waiting}</span> espera ·{" "}
                  {formatClock(p.avg)} prom. · <span className="text-late">{p.late}</span> tarde
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="board-panel rounded-xl p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Por día
          </h3>
          {stats.byDay.length === 0 ? (
            <p className="mt-3 text-muted-foreground">Aún sin entregas registradas</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {stats.byDay.map(([day, v]) => (
                <li
                  key={day}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                >
                  <span className="tabular min-w-0 truncate text-lg font-semibold">{day}</span>
                  <span className="tabular shrink-0 text-sm text-muted-foreground">
                    <span className="text-ok">{v.done}</span> entregas ·{" "}
                    {formatClock(v.sum / v.done)} prom. ·{" "}
                    <span className="text-late">{v.late}</span> tarde
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
