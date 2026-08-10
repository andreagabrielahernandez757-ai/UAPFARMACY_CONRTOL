import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RangeFilter } from "@/components/RangeFilter";
import { defaultRange, filterByRange, type RangeValue } from "@/lib/range";
import {
  LATE_MINUTES,
  OUTCOME_ICONS,
  OUTCOME_LABELS,
  PHARMACY_LABELS,
  PHARMACY_SHORT,
  formatClock,
  formatTime,
  isDelivered,
  statusFor,
  type Delivery,
  type Outcome,
  type Pharmacy,
} from "@/lib/deliveries";

const toneFor = (mins: number) => {
  const st = statusFor(mins);
  return st === "late" ? "text-late" : st === "warn" ? "text-warn" : "text-ok";
};

const outcomeOf = (r: Delivery): Outcome => r.outcome ?? "entregado";

async function exportToExcel(rows: Delivery[]) {
  const XLSX = await import("xlsx");
  const data = rows.map((r) => ({
    Ticket: r.ticket,
    Paciente: r.patient_name,
    Farmacia: PHARMACY_LABELS[r.pharmacy],
    Fecha: new Date(r.started_at).toLocaleDateString("es-SV"),
    Ingreso: formatTime(r.started_at),
    Cierre: r.delivered_at ? formatTime(r.delivered_at) : "",
    "Tiempo total (min)": r.total_minutes ?? "",
    "Motivo de cierre": OUTCOME_LABELS[outcomeOf(r)],
    Estado: !isDelivered(r)
      ? "Incidencia"
      : (r.total_minutes ?? 0) >= LATE_MINUTES
        ? "Fuera de tiempo"
        : "En tiempo",
    Observaciones: r.observations ?? "",
  }));
  const sheet = XLSX.utils.json_to_sheet(data);
  sheet["!cols"] = [
    { wch: 10 },
    { wch: 28 },
    { wch: 22 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 18 },
    { wch: 24 },
    { wch: 16 },
    { wch: 40 },
  ];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Historial");
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(book, `historial-entregas-${stamp}.xlsx`);
}


export function HistoryTable({
  rows,
  lockedPharmacy,
}: {
  rows: Delivery[];
  lockedPharmacy?: Pharmacy;
}) {
  const [query, setQuery] = useState("");
  const [pharmacy, setPharmacy] = useState<Pharmacy | "all">(lockedPharmacy ?? "all");
  const [range, setRange] = useState<RangeValue>({ ...defaultRange, preset: "all" });
  const [exporting, setExporting] = useState(false);

  const done = useMemo(() => {
    const q = query.trim().toLowerCase();
    return filterByRange(
      rows.filter((r) => r.delivered_at),
      range,
      Date.now(),
    )
      .filter((r) => (lockedPharmacy ? r.pharmacy === lockedPharmacy : true))
      .filter((r) => (pharmacy === "all" ? true : r.pharmacy === pharmacy))
      .filter(
        (r) =>
          !q ||
          r.ticket.toLowerCase().includes(q) ||
          r.patient_name.toLowerCase().includes(q) ||
          (r.observations ?? "").toLowerCase().includes(q),
      );
  }, [rows, query, pharmacy, lockedPharmacy, range]);

  const download = async () => {
    if (done.length === 0) {
      toast.error("No hay registros para exportar");
      return;
    }
    setExporting(true);
    try {
      await exportToExcel(done);
      toast.success(`Historial exportado · ${done.length} registros`);
    } catch {
      toast.error("No se pudo exportar el historial");
    } finally {
      setExporting(false);
    }
  };

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
            placeholder="Buscar ticket, paciente u observación"
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

      <div className="board-panel rule-top grid gap-3 p-4 sm:flex sm:flex-wrap sm:items-end sm:justify-between">
        <RangeFilter value={range} onChange={setRange} />
        <Button
          type="button"
          onClick={download}
          disabled={exporting}
          className="h-11 font-bold uppercase tracking-widest"
        >
          {exporting ? "Exportando…" : "Exportar a Excel"}
        </Button>
      </div>

      <div className="board-panel rule-top overflow-hidden">
        <div className="hidden grid-cols-[7rem_minmax(0,1fr)_11rem_6rem_6rem_11rem_7rem] gap-3 border-b border-border bg-secondary px-4 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-secondary-foreground lg:grid">
          <span>Ticket</span>
          <span>Paciente</span>
          <span>Farmacia</span>
          <span>Ingreso</span>
          <span>Cierre</span>
          <span>Motivo</span>
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
              const outcome = outcomeOf(d);
              const delivered = outcome === "entregado";
              return (
                <li
                  key={d.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-0 odd:bg-muted/40 lg:grid-cols-[7rem_minmax(0,1fr)_11rem_6rem_6rem_11rem_7rem]"
                >
                  <span className="tabular text-lg font-bold text-primary">{d.ticket}</span>
                  <span className="col-span-2 min-w-0 lg:col-span-1">
                    <span className="block truncate font-semibold">{d.patient_name}</span>
                    {d.observations ? (
                      <span className="block truncate text-xs text-muted-foreground">
                        {d.observations}
                      </span>
                    ) : null}
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
                    className={`truncate text-xs font-bold uppercase tracking-wider ${
                      delivered ? "text-ok" : "text-warn"
                    }`}
                    title={OUTCOME_LABELS[outcome]}
                  >
                    {OUTCOME_ICONS[outcome]} {OUTCOME_LABELS[outcome]}
                  </span>
                  <span
                    className={`tabular text-right text-lg font-bold ${
                      delivered ? toneFor(mins) : "text-muted-foreground"
                    }`}
                    title={
                      delivered
                        ? mins >= LATE_MINUTES
                          ? "Fuera de tiempo"
                          : "Dentro del tiempo"
                        : "Incidencia: no cuenta para el promedio"
                    }
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
