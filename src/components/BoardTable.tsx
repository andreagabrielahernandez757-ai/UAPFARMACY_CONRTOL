import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  PHARMACY_SHORT,
  elapsedMinutes,
  formatClock,
  formatTime,
  markDelivered,
  statusFor,
  type Delivery,
  type Status,
} from "@/lib/deliveries";

const statusStyles: Record<Status, string> = {
  ok: "bg-ok text-ok-foreground",
  warn: "bg-warn text-warn-foreground",
  late: "bg-late text-late-foreground pulse-late",
};

const statusLabel: Record<Status, string> = {
  ok: "En tiempo",
  warn: "Por vencer",
  late: "Excedido",
};

export function BoardTable({ rows, now }: { rows: Delivery[]; now: number }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: markDelivered,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success("Medicamento entregado");
    },
    onError: () => toast.error("No se pudo finalizar el registro"),
  });

  if (rows.length === 0) {
    return (
      <div className="board-panel rounded-xl p-10 text-center text-lg uppercase tracking-widest text-muted-foreground">
        Sin pacientes en espera
      </div>
    );
  }

  return (
    <div className="board-panel overflow-hidden rounded-xl">
      <div className="hidden grid-cols-[7rem_minmax(0,1fr)_11rem_7rem_8rem_12rem] gap-3 border-b border-border bg-secondary/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground lg:grid">
        <span>Ticket</span>
        <span>Paciente</span>
        <span>Farmacia</span>
        <span>Ingreso</span>
        <span>Tiempo</span>
        <span className="text-right">Estado</span>
      </div>
      <ul>
        {rows.map((d) => {
          const mins = elapsedMinutes(d, now);
          const st = statusFor(mins);
          return (
            <li
              key={d.id}
              className="flip-row grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border/60 px-4 py-4 last:border-0 lg:grid-cols-[7rem_minmax(0,1fr)_11rem_7rem_8rem_12rem]"
            >
              <span className="tabular shrink-0 text-2xl font-bold text-primary lg:text-3xl">
                {d.ticket}
              </span>
              <span className="col-span-2 min-w-0 truncate text-xl font-semibold uppercase lg:col-span-1 lg:text-2xl">
                {d.patient_name}
              </span>
              <span className="text-sm font-semibold uppercase tracking-widest text-accent">
                {PHARMACY_SHORT[d.pharmacy]}
              </span>
              <span className="tabular text-lg text-muted-foreground">
                {formatTime(d.started_at)}
              </span>
              <span
                className={`tabular w-fit rounded-md px-3 py-1 text-2xl font-bold ${statusStyles[st]}`}
              >
                {formatClock(mins)}
              </span>
              <div className="col-span-2 flex items-center justify-start gap-3 lg:col-span-1 lg:justify-end">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {statusLabel[st]}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate(d)}
                  className="h-10 font-bold uppercase tracking-wider"
                >
                  Entregado
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
