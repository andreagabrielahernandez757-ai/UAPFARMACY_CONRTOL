import { useMemo, useState } from "react";
import { BoardTable } from "@/components/BoardTable";
import { Input } from "@/components/ui/input";
import { LATE_MINUTES, WARN_MINUTES, type Delivery } from "@/lib/deliveries";

export function LiveBoard({
  title,
  waiting,
  now,
  mounted,
  isError,
}: {
  title: string;
  waiting: Delivery[];
  now: number;
  mounted: boolean;
  isError: boolean;
}) {
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return waiting;
    return waiting.filter(
      (r) =>
        r.ticket.toLowerCase().includes(q) ||
        r.patient_name.toLowerCase().includes(q) ||
        (r.observations ?? "").toLowerCase().includes(q),
    );
  }, [waiting, query]);

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
        <h2 className="truncate text-xl font-bold uppercase tracking-[0.12em] text-primary sm:text-2xl">
          {title} · {rows.length}
        </h2>
        <div className="flex shrink-0 flex-wrap items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2">
            <i className="size-2.5 rounded-full bg-ok" /> &lt; {WARN_MINUTES} min
          </span>
          <span className="flex items-center gap-2">
            <i className="size-2.5 rounded-full bg-warn" /> {WARN_MINUTES}–{LATE_MINUTES} min
          </span>
          <span className="flex items-center gap-2">
            <i className="size-2.5 rounded-full bg-late" /> &gt; {LATE_MINUTES} min
          </span>
        </div>
      </div>

      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar ticket, paciente u observación en espera"
        className="h-11 sm:max-w-md"
        aria-label="Buscar en pacientes en espera"
      />

      {isError ? (
        <div className="board-panel rule-top p-6 text-center font-semibold uppercase tracking-widest text-late">
          Error al cargar el tablero
        </div>
      ) : mounted ? (
        <BoardTable rows={rows} now={now} />
      ) : (
        <div className="board-panel rule-top p-10 text-center uppercase tracking-widest text-muted-foreground">
          Cargando tablero…
        </div>
      )}
    </section>
  );
}
