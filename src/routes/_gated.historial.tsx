import { createFileRoute } from "@tanstack/react-router";
import { HistoryTable } from "@/components/HistoryTable";
import { useDeliveries } from "@/hooks/use-board";

export const Route = createFileRoute("/_gated/historial")({
  head: () => ({
    meta: [
      { title: "Historial de entregas · FarmaTiempo" },
      {
        name: "description",
        content:
          "Consulte el historial completo de entregas de medicamentos con ticket, paciente, farmacia, hora de ingreso, hora de entrega y tiempo total.",
      },
      { property: "og:title", content: "Historial de entregas · FarmaTiempo" },
      {
        property: "og:description",
        content:
          "Búsqueda por ticket o paciente y filtro por farmacia sobre todas las entregas registradas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Historial,
});

function Historial() {
  const { rows } = useDeliveries();
  return <HistoryTable rows={rows} />;
}
