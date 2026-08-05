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

export type Delivery = {
  id: string;
  ticket: string;
  patient_name: string;
  pharmacy: Pharmacy;
  started_at: string;
  delivered_at: string | null;
  total_minutes: number | null;
};

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
    .select("id, ticket, patient_name, pharmacy, started_at, delivered_at, total_minutes")
    .order("started_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Delivery[];
}

export async function startWait(input: {
  ticket: string;
  patient_name: string;
  pharmacy: Pharmacy;
}) {
  const { error } = await supabase.from("deliveries").insert({
    ticket: input.ticket,
    patient_name: input.patient_name,
    pharmacy: input.pharmacy,
  });
  if (error) throw error;
}

export async function markDelivered(d: Delivery) {
  const now = new Date();
  const minutes = (now.getTime() - new Date(d.started_at).getTime()) / 60000;
  const { error } = await supabase
    .from("deliveries")
    .update({
      delivered_at: now.toISOString(),
      total_minutes: Math.round(minutes * 100) / 100,
    })
    .eq("id", d.id);
  if (error) throw error;
}
