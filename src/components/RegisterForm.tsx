import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PHARMACY_LABELS, startWait, type Pharmacy } from "@/lib/deliveries";

export function RegisterForm() {
  const [ticket, setTicket] = useState("");
  const [name, setName] = useState("");
  const [pharmacy, setPharmacy] = useState<Pharmacy | "">("");
  const queryClient = useQueryClient();

  const nowLabel = useMemo(
    () =>
      new Date().toLocaleTimeString("es-SV", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [],
  );

  const mutation = useMutation({
    mutationFn: startWait,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      toast.success(`Ticket ${ticket.trim()} en espera`);
      setTicket("");
      setName("");
      setPharmacy("");
    },
    onError: () => toast.error("No se pudo registrar el paciente"),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = ticket.trim().slice(0, 20);
    const n = name.trim().slice(0, 120);
    if (!t || !n || !pharmacy) {
      toast.error("Complete ticket, nombre y farmacia");
      return;
    }
    mutation.mutate({ ticket: t, patient_name: n, pharmacy });
  };

  return (
    <form
      onSubmit={submit}
      className="board-panel rounded-xl p-4 sm:p-6"
      aria-label="Registro de paciente"
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:justify-between">
        <h2 className="truncate text-2xl font-bold uppercase tracking-widest text-primary">
          Registro de paciente
        </h2>
        <span className="tabular shrink-0 text-sm text-muted-foreground">
          Ingreso {nowLabel}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="ticket" className="uppercase tracking-wider">
            Número de ticket
          </Label>
          <Input
            id="ticket"
            value={ticket}
            maxLength={20}
            onChange={(e) => setTicket(e.target.value)}
            placeholder="A-104"
            className="tabular h-12 text-lg uppercase"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="name" className="uppercase tracking-wider">
            Nombre del paciente
          </Label>
          <Input
            id="name"
            value={name}
            maxLength={120}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre completo"
            className="h-12 text-lg"
          />
        </div>
        <div className="grid gap-2">
          <Label className="uppercase tracking-wider">Farmacia</Label>
          <Select value={pharmacy} onValueChange={(v) => setPharmacy(v as Pharmacy)}>
            <SelectTrigger className="h-12 text-lg" aria-label="Farmacia">
              <SelectValue placeholder="Seleccione" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(PHARMACY_LABELS) as Pharmacy[]).map((p) => (
                <SelectItem key={p} value={p} className="text-base">
                  {PHARMACY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="mt-5 h-14 w-full text-xl font-bold uppercase tracking-widest md:w-auto md:px-10"
      >
        {mutation.isPending ? "Registrando…" : "Iniciar espera"}
      </Button>
    </form>
  );
}
