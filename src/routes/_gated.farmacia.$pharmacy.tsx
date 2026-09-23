import { createFileRoute, notFound } from "@tanstack/react-router";
import { useMemo } from "react";
import { RegisterForm } from "@/components/RegisterForm";
import { LiveBoard } from "@/components/LiveBoard";
import { StatsPanel } from "@/components/StatsPanel";
import { HistoryTable } from "@/components/HistoryTable";
import { useClock, useDeliveries, useTicker } from "@/hooks/use-board";
import { PHARMACY_LABELS, type Pharmacy } from "@/lib/deliveries";

function isPharmacy(v: string): v is Pharmacy {
  return v === "comunes" || v === "especializada" || v === "central";
}

export const Route = createFileRoute("/_gated/farmacia/$pharmacy")({
  loader: ({ params }) => {
    if (!isPharmacy(params.pharmacy)) throw notFound();
    return { pharmacy: params.pharmacy as Pharmacy };
  },
  head: ({ loaderData }) => {
    const label = loaderData ? PHARMACY_LABELS[loaderData.pharmacy] : "Farmacia";
    return {
      meta: [
        { title: `${label} · FarmaTiempo` },
        {
          name: "description",
          content: `Tablero y estadísticas de entrega de medicamentos de la farmacia ${label.toLowerCase()}.`,
        },
        { property: "og:title", content: `${label} · FarmaTiempo` },
        {
          property: "og:description",
          content: `Pacientes en espera, cronómetros con semáforo e historial de la farmacia ${label.toLowerCase()}.`,
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        ...(loaderData ? [] : [{ name: "robots", content: "noindex" }]),
      ],
    };
  },
  component: FarmaciaPage,
  errorComponent: () => (
    <div className="board-panel rule-top p-8 text-center font-semibold uppercase tracking-widest text-late">
      No se pudo cargar la farmacia
    </div>
  ),
  notFoundComponent: () => (
    <div className="board-panel rule-top p-8 text-center font-semibold uppercase tracking-widest text-muted-foreground">
      Farmacia no encontrada
    </div>
  ),
});

function FarmaciaPage() {
  const { pharmacy } = Route.useLoaderData() as { pharmacy: Pharmacy };
  const now = useTicker();
  const { mounted } = useClock(now);
  const { rows, isError } = useDeliveries();

  const mine = useMemo(() => rows.filter((r) => r.pharmacy === pharmacy), [rows, pharmacy]);
  const waiting = useMemo(() => mine.filter((r) => !r.delivered_at), [mine]);

  return (
    <>
      <div className="board-panel rule-top px-4 py-4 sm:px-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Apartado de farmacia
        </p>
        <h2 className="mt-1 text-2xl font-bold uppercase tracking-[0.1em] text-primary sm:text-3xl">
          {PHARMACY_LABELS[pharmacy]}
        </h2>
      </div>

      <RegisterForm defaultPharmacy={pharmacy} />

      <LiveBoard
        title="En espera en esta farmacia"
        waiting={waiting}
        now={now}
        mounted={mounted}
        isError={isError}
      />

      {mounted ? <StatsPanel rows={mine} now={now} lockedPharmacy={pharmacy} /> : null}

      <HistoryTable rows={mine} lockedPharmacy={pharmacy} />
    </>
  );
}
