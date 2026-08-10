import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  OUTCOME_LABELS,
  OUTCOME_ORDER,
  closeDelivery,
  type Delivery,
  type Outcome,
} from "@/lib/deliveries";

export function FinishAttention({ delivery }: { delivery: Delivery }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<Outcome | null>(null);

  const mutation = useMutation({
    mutationFn: (outcome: Outcome) => closeDelivery(delivery, outcome),
    onSuccess: (_data, outcome) => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success(`${OUTCOME_ICONS[outcome]} ${OUTCOME_LABELS[outcome]}`, {
        description: `Ticket ${delivery.ticket} · ${delivery.patient_name}`,
      });
    },
    onError: () => toast.error("No se pudo finalizar la atención"),
  });

  const choose = (outcome: Outcome) => {
    if (outcome === "entregado") {
      mutation.mutate(outcome);
      return;
    }
    setPending(outcome);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="secondary"
            disabled={mutation.isPending}
            className="h-10 font-bold uppercase tracking-wider"
          >
            {mutation.isPending ? "Guardando…" : "Finalizar atención"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="uppercase tracking-wider">
            Motivo de cierre
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {OUTCOME_ORDER.map((o) => (
            <DropdownMenuItem
              key={o}
              onSelect={() => choose(o)}
              className="cursor-pointer text-base font-semibold"
            >
              <span className="mr-2">{OUTCOME_ICONS[o]}</span>
              {OUTCOME_LABELS[o]}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="uppercase tracking-wider">
              ¿Confirmar cierre de atención?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrará el ticket <strong>{delivery.ticket}</strong> de{" "}
              <strong>{delivery.patient_name}</strong> con el motivo{" "}
              <strong>{pending ? OUTCOME_LABELS[pending] : ""}</strong>. Quedará en el
              historial como incidencia y no se incluirá en el tiempo promedio de entrega.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) mutation.mutate(pending);
                setPending(null);
              }}
            >
              Sí, cerrar atención
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
