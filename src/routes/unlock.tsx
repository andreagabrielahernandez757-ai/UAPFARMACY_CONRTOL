import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockSite } from "@/lib/gate.functions";

export const Route = createFileRoute("/unlock")({
  head: () => ({
    meta: [
      { title: "Acceso · FarmaTiempo" },
      {
        name: "description",
        content:
          "Ingrese la contraseña asignada para acceder al monitoreo de entrega de medicamentos.",
      },
      { property: "og:title", content: "Acceso · FarmaTiempo" },
      {
        property: "og:description",
        content: "Área restringida del servicio de farmacia. Se requiere contraseña.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Unlock,
});

function Unlock() {
  const router = useRouter();
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) {
        await router.invalidate();
        await router.navigate({ to: "/" });
        return;
      }
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <form
        onSubmit={submit}
        className="board-panel rule-top w-full max-w-md p-6 sm:p-8"
        aria-label="Acceso restringido"
      >
        <span
          aria-hidden
          className="grid size-12 place-items-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground"
        >
          ✚
        </span>
        <h1 className="mt-4 text-2xl font-bold uppercase tracking-[0.12em] text-primary">
          FarmaTiempo
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acceso restringido al personal del servicio de farmacia.
        </p>

        <div className="mt-6 grid gap-2">
          <Label htmlFor="password" className="uppercase tracking-wider">
            Contraseña asignada
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 text-lg"
          />
        </div>

        {error ? (
          <p className="mt-3 text-sm font-semibold uppercase tracking-wider text-late">
            Contraseña incorrecta
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className="mt-6 h-13 w-full text-lg font-bold uppercase tracking-widest"
        >
          {loading ? "Verificando…" : "Entrar"}
        </Button>
      </form>
    </main>
  );
}
