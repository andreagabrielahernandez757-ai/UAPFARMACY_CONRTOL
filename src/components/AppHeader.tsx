import { Link } from "@tanstack/react-router";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PHARMACY_LABELS, type Pharmacy } from "@/lib/deliveries";
import { lockSite } from "@/lib/gate.functions";

const navBase =
  "rounded-md px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] transition-colors hover:bg-primary-foreground/15";

export function AppHeader({ clock, today }: { clock: string; today: string }) {
  const router = useRouter();
  const lock = useServerFn(lockSite);

  const salir = async () => {
    await lock({ data: undefined as never });
    await router.invalidate();
    await router.navigate({ to: "/unlock" });
  };

  return (
    <header className="clinic-header px-4 py-4 sm:px-7 sm:py-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
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
      </div>

      <nav className="mt-4 flex flex-wrap items-center gap-1 border-t border-primary-foreground/20 pt-3">
        <Link
          to="/"
          activeOptions={{ exact: true }}
          activeProps={{ className: "bg-primary-foreground/20" }}
          className={navBase}
        >
          Dashboard central
        </Link>
        {(Object.keys(PHARMACY_LABELS) as Pharmacy[]).map((p) => (
          <Link
            key={p}
            to="/farmacia/$pharmacy"
            params={{ pharmacy: p }}
            activeProps={{ className: "bg-primary-foreground/20" }}
            className={navBase}
          >
            {PHARMACY_LABELS[p]}
          </Link>
        ))}
        <Link
          to="/historial"
          activeProps={{ className: "bg-primary-foreground/20" }}
          className={navBase}
        >
          Historial
        </Link>
        <button type="button" onClick={salir} className={`${navBase} ml-auto opacity-80`}>
          Salir
        </button>
      </nav>
    </header>
  );
}
