import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LATE_MINUTES,
  PHARMACY_LABELS,
  PHARMACY_SHORT,
  formatClock,
  formatTime,
  statusFor,
  type Delivery,
  type Pharmacy,
} from "@/lib/deliveries";

const toneFor = (mins: number) => {
  const st = statusFor(mins);
  return st === "late" ? "text-late" : st === "warn" ? "text-warn" : "text-ok";
};

export function HistoryTable({
  rows,
  lockedPharmacy,
}: {
  rows: Delivery[];
  lockedPharmacy?: Pharmacy;
}) {
  const [query, setQuery] = useState("");
  const [pharmacy, setPharmacy] = useState<Pharmacy | "all">(lockedPharmacy ?? "all");

  const done = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((r) => r.delivered_at)
      .filter((r) => (lockedPharmacy ? r.pharmacy === lockedPharmacy : true))
      .filter((r) => (pharmacy === "all" ? true : r.pharmacy === pharmacy))
      .filter(
        (r) =>
          !q ||
          r.ticket.toLowerCase().includes(q) ||
          r.patient_name.toLowerCase().includes(q),
      );
  }, [rows, query, pharmacy, lockedPharmacy]);

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:flex sm:items-end sm:justify-between">
        <h2 className="text-xl font-bold uppercase tracking-[0.12em] text-primary sm:text-2xl">
          Historial de entregas · {done.length}
        </h2>
        <div className="grid gap-3 sm:flex sm:items-center">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar ticket o paciente"
            className="h-11 sm:w-64"
            aria-label="Buscar en historial"
          />
          {lockedPharmacy ? null : (
            <Select
              value={pharmacy}
              onValueChange={(v) => setPharmacy(v as Pharmacy | "all")}
            >
              <SelectTrigger className="h-11 sm:w-56" aria-label="Filtrar por farmacia">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las farmacias</SelectItem>
                {(Object.keys(PHARMACY_LABELS) as Pharmacy[]).map((p) => (
                  <SelectItem key={p} value={p}>
                    {PHARMACY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="board-panel rule-top overflow-hidden">
        <div className="hidden grid-cols-[7rem_minmax(0,1fr)_11rem_7rem_7rem_8rem] gap-3 border-b border-border bg-secondary px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-foreground lg:grid">
          <span>Ticket</span>
          <span>Paciente</span>
          <span>Farmacia</span>
          <span>Ingreso</span>
          <span>Entrega</span>
          <span className="text-right">Tiempo total</span>
        </div>
        {done.length === 0 ? (
          <p className="p-8 text-center font-semibold uppercase tracking-widest text-muted-foreground">
            Sin registros en el historial
          </p>
        ) : (
          <ul className="max-h-[32rem] overflow-y-auto">
            {done.map((d) => {
              const mins = d.total_minutes ?? 0;
              return (
                <li
                  key={d.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-0 odd:bg-muted/40 lg:grid-cols-[7rem_minmax(0,1fr)_11rem_7rem_7rem_8rem]"
                >
                  <span className="tabular text-lg font-bold text-primary">{d.ticket}</span>
                  <span className="col-span-2 min-w-0 truncate font-semibold lg:col-span-1">
                    {d.patient_name}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    {PHARMACY_SHORT[d.pharmacy]}
                  </span>
                  <span className="tabular text-muted-foreground">
                    {formatTime(d.started_at)}
                  </span>
                  <span className="tabular text-muted-foreground">
                    {d.delivered_at ? formatTime(d.delivered_at) : "—"}
                  </span>
                  <span
                    className={`tabular text-right text-lg font-bold ${toneFor(mins)}`}
                    title={mins >= LATE_MINUTES ? "Fuera de tiempo" : "Dentro del tiempo"}
                  >
                    {formatClock(mins)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
