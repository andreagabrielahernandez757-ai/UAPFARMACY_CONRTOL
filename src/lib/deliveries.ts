import { supabase } from "@/integrations/supabase/client";

export type Pharmacy = "comunes" | "especializada" | "central";

export const PHARMACY_LABELS: Record<Pharmacy, string> = {
  comunes: "Enfermedades comunes",
  especializada: "Especializada",
  central: "Central",
};

export const PHARMACY_SHORT: Record<Pharmacy, string> = {
  comunes: "COMUNES",
  especializada: "ESPECIALIZADA",
  central: "CENTRAL",
};

/** Límites de tiempo en minutos */
export const WARN_MINUTES = 20;
export const LATE_MINUTES = 30;

export type Outcome =
  | "entregado"
  | "retirado"
  | "sin_respuesta"
  | "cancelado"
  | "otro";

export const OUTCOME_LABELS: Record<Outcome, string> = {
  entregado: "Medicamento entregado",
  retirado: "Paciente se retiró",
  sin_respuesta: "No respondió al llamado",
  cancelado: "Atención cancelada",
  otro: "Otro motivo",
};

export const OUTCOME_ORDER: Outcome[] = [
  "entregado",
  "retirado",
  "sin_respuesta",
  "cancelado",
  "otro",
];

export type Delivery = {
  id: string;
  ticket: string;
  patient_name: string;
  pharmacy: Pharmacy;
  started_at: string;
  delivered_at: string | null;
  total_minutes: number | null;
  observations: string | null;
  outcome: Outcome | null;
};

/** Solo las entregas efectivas cuentan para el tiempo promedio */
export function isDelivered(d: Delivery): boolean {
  return !!d.delivered_at && (d.outcome ?? "entregado") === "entregado";
}

export function isIncident(d: Delivery): boolean {
  return !!d.delivered_at && (d.outcome ?? "entregado") !== "entregado";
}

export type Status = "ok" | "warn" | "late";


export function statusFor(minutes: number): Status {
  if (minutes >= LATE_MINUTES) return "late";
  if (minutes >= WARN_MINUTES) return "warn";
  return "ok";
}

export function elapsedMinutes(d: Delivery, now: number): number {
  const end = d.delivered_at ? new Date(d.delivered_at).getTime() : now;
  return (end - new Date(d.started_at).getTime()) / 60000;
}

export function formatClock(minutes: number): string {
  const total = Math.max(0, Math.floor(minutes * 60));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-SV", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export async function fetchDeliveries(): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from("deliveries")
    .select(
      "id, ticket, patient_name, pharmacy, started_at, delivered_at, total_minutes, observations, outcome",
    )
    .order("started_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Delivery[];
}

export async function startWait(input: {
  ticket: string;
  patient_name: string;
  pharmacy: Pharmacy;
  observations?: string;
}) {
  const { error } = await supabase.from("deliveries").insert({
    ticket: input.ticket,
    patient_name: input.patient_name,
    pharmacy: input.pharmacy,
    observations: input.observations?.trim() ? input.observations.trim() : null,
  });
  if (error) throw error;
}

/** Cierra la atención registrando el motivo. El tiempo total se guarda siempre. */
export async function closeDelivery(d: Delivery, outcome: Outcome) {
  const now = new Date();
  const minutes = (now.getTime() - new Date(d.started_at).getTime()) / 60000;
  const { error } = await supabase
    .from("deliveries")
    .update({
      delivered_at: now.toISOString(),
      total_minutes: Math.round(minutes * 100) / 100,
      outcome,
    })
    .eq("id", d.id);
  if (error) throw error;
}

