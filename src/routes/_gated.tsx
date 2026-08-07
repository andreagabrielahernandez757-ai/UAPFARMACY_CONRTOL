import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { useClock, useTicker } from "@/hooks/use-board";
import { getGateStatus } from "@/lib/gate.functions";

export const Route = createFileRoute("/_gated")({
  beforeLoad: async () => {
    const { unlocked } = await getGateStatus();
    if (!unlocked) throw redirect({ to: "/unlock" });
  },
  component: GatedLayout,
});

function GatedLayout() {
  const now = useTicker();
  const { clock, today } = useClock(now);

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 px-3 py-5 sm:px-6 sm:py-8">
      <AppHeader clock={clock} today={today} />
      <Outlet />
    </div>
  );
}
