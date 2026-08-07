import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { RegisterForm } from "@/components/RegisterForm";
import { LiveBoard } from "@/components/LiveBoard";
import { StatsPanel } from "@/components/StatsPanel";
import { useClock, useDeliveries, useTicker } from "@/hooks/use-board";

export const Route = createFileRoute("/_gated/")({
  head: () => ({
    meta: [
      { title: "Dashboard central · FarmaTiempo" },
      {
        name: "description",
        content:
          "Tablero central en tiempo real de entregas de medicamentos: registro de pacientes, cronómetros con semáforo y estadísticas globales.",
      },
      { property: "og:title", content: "Dashboard central · FarmaTiempo" },
      {
        property: "og:description",
        content:
          "Registre tickets, vigile tiempos de espera con semáforo visual y consulte estadísticas por farmacia y por día.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Central,
});

function Central() {
  const now = useTicker();
  const { mounted } = useClock(now);
  const { rows, isError } = useDeliveries();
  const waiting = useMemo(() => rows.filter((r) => !r.delivered_at), [rows]);

  return (
    <>
      <RegisterForm />
      <LiveBoard
        title="Pacientes en espera"
        waiting={waiting}
        now={now}
        mounted={mounted}
        isError={isError}
      />
      {mounted ? <StatsPanel rows={rows} now={now} /> : null}
    </>
  );
}
