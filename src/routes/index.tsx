import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RegisterForm } from "@/components/RegisterForm";
import { BoardTable } from "@/components/BoardTable";
import { StatsPanel } from "@/components/StatsPanel";
import {
  LATE_MINUTES,
  WARN_MINUTES,
  fetchDeliveries,
  type Delivery,
} from "@/lib/deliveries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FarmaTiempo · Monitoreo de entrega de medicamentos" },
      {
        name: "description",
        content:
          "Tablero hospitalario en tiempo real para medir el tiempo de entrega de medicamentos por farmacia, con alertas visuales y estadísticas.",
      },
      { property: "og:title", content: "FarmaTiempo · Monitoreo de entregas de farmacia" },
      {
        property: "og:description",
        content:
          "Registre tickets, vigile tiempos de espera con semáforo visual y consulte estadísticas por farmacia y por día.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useTicker() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Index() {
  const now = useTicker();
  const mounted = now > 0;
  const { data, refetch, isError } = useQuery({
    queryKey: ["deliveries"],
    queryFn: fetchDeliveries,
    refetchInterval: 20000,
  });

  useEffect(() => {
    const channel = supabase
      .channel("deliveries-board")
      .on("postgres_changes", { event: "*", schema: "public", table: "deliveries" }, () => {
        refetch();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const rows: Delivery[] = data ?? [];
  const waiting = useMemo(() => rows.filter((r) => !r.delivered_at), [rows]);

  const clock = mounted ? new Date(now).toLocaleTimeString("es-SV", { hour12: false }) : "--:--:--";
  const today = mounted
    ? new Date(now).toLocaleDateString("es-SV", {
        weekday: "long",
        day: "2-digit",
        month: "long",
      })
    : "";

  return (
    <main className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-5 sm:px-6 sm:py-8">
      <header className="clinic-header grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-4 sm:px-7 sm:py-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span
            aria-hidden
            className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary-foreground/15 text-2xl font-bold sm:size-14 sm:text-3xl"
          >
            ✚
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold uppercase tracking-[0.12em] sm:text-4xl">
              FarmaTiempo
            </h1>
            <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.22em] opacity-80 sm:text-sm">
              Servicio de farmacia · Monitoreo de entregas
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-2xl font-bold sm:text-4xl">{clock}</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-80 sm:text-xs">
            {today}
          </p>
        </div>
      </header>

      <RegisterForm />

      <section className="space-y-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:justify-between">
          <h2 className="truncate text-xl font-bold uppercase tracking-[0.12em] text-primary sm:text-2xl">
            Pacientes en espera · {waiting.length}
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
        {isError ? (
          <div className="board-panel rule-top p-6 text-center font-semibold uppercase tracking-widest text-late">
            Error al cargar el tablero
          </div>
        ) : mounted ? (
          <BoardTable rows={waiting} now={now} />
        ) : (
          <div className="board-panel rule-top p-10 text-center uppercase tracking-widest text-muted-foreground">
            Cargando tablero…
          </div>
        )}
      </section>

      {mounted ? <StatsPanel rows={rows} now={now} /> : null}
    </main>
  );
}
