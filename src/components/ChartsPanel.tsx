import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RangeFilter } from "@/components/RangeFilter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { defaultRange, filterByRange, RANGE_LABELS, type RangeValue } from "@/lib/range";
import {
  LATE_MINUTES,
  PHARMACY_LABELS,
  WARN_MINUTES,
  elapsedMinutes,
  isDelivered,
  type Delivery,
  type Pharmacy,
} from "@/lib/deliveries";

const OK = "var(--ok)";
const WARN = "var(--warn)";
const LATE = "var(--late)";
const PRIMARY = "var(--primary)";

const axisProps = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  tickLine: false,
} as const;

function tooltipStyle() {
  return {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      fontSize: 12,
      color: "var(--foreground)",
    },
    labelStyle: { color: "var(--muted-foreground)" },
  };
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="board-panel p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h3>
      {subtitle ? (
        <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children as React.ReactElement}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function ChartsPanel({ rows, now }: { rows: Delivery[]; now: number }) {
  const [range, setRange] = useState<RangeValue>({ ...defaultRange, preset: "7d" });
  const [pharmacy, setPharmacy] = useState<Pharmacy | "all">("all");

  const scoped = useMemo(() => {
    const byDate = filterByRange(rows, range, now);
    return pharmacy === "all" ? byDate : byDate.filter((r) => r.pharmacy === pharmacy);
  }, [rows, range, now, pharmacy]);

  const delivered = useMemo(() => scoped.filter(isDelivered), [scoped]);

  const byHour = useMemo(() => {
    const buckets = new Map<number, number[]>();
    for (const d of delivered) {
      const h = new Date(d.started_at).getHours();
      const arr = buckets.get(h) ?? [];
      arr.push(d.total_minutes ?? elapsedMinutes(d, now));
      buckets.set(h, arr);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([h, xs]) => ({
        hora: `${String(h).padStart(2, "0")}:00`,
        minutos: round1(avg(xs)),
        casos: xs.length,
      }));
  }, [delivered, now]);

  /** Picos relevantes: horas >= 20% sobre el promedio general del rango (mínimo 2 casos) */
  const hourPeaks = useMemo(() => {
    if (byHour.length < 2) return { mean: 0, threshold: 0, peaks: [] as typeof byHour };
    const mean = avg(byHour.map((b) => b.minutos));
    const threshold = Math.max(mean * 1.2, mean + 2);
    const peaks = byHour.filter((b) => b.minutos >= threshold && b.casos >= 2);
    return { mean: round1(mean), threshold: round1(threshold), peaks };
  }, [byHour]);

  const peakHours = useMemo(
    () => new Set(hourPeaks.peaks.map((p) => p.hora)),
    [hourPeaks],
  );

  const worstHour = useMemo(
    () =>
      byHour.length
        ? byHour.reduce((a, b) => (b.minutos > a.minutos ? b : a))
        : null,
    [byHour],
  );

  const byPharmacy = useMemo(
    () =>
      (Object.keys(PHARMACY_LABELS) as Pharmacy[]).map((p) => {
        const xs = delivered
          .filter((d) => d.pharmacy === p)
          .map((d) => d.total_minutes ?? 0);
        return {
          farmacia: PHARMACY_LABELS[p],
          minutos: round1(avg(xs)),
        };
      }),
    [delivered],
  );

  const byStatus = useMemo(() => {
    const mins = scoped.map((d) => (d.delivered_at ? (d.total_minutes ?? 0) : elapsedMinutes(d, now)));
    return [
      {
        estado: "Dentro de tiempo",
        pacientes: mins.filter((m) => m < WARN_MINUTES).length,
        fill: OK,
      },
      {
        estado: "Próximo a vencer",
        pacientes: mins.filter((m) => m >= WARN_MINUTES && m < LATE_MINUTES).length,
        fill: WARN,
      },
      {
        estado: "Fuera de tiempo",
        pacientes: mins.filter((m) => m >= LATE_MINUTES).length,
        fill: LATE,
      },
    ];
  }, [scoped, now]);

  const byDay = useMemo(() => {
    const buckets = new Map<number, number[]>();
    for (const d of delivered) {
      const dt = new Date(d.started_at);
      const key = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
      const arr = buckets.get(key) ?? [];
      arr.push(d.total_minutes ?? 0);
      buckets.set(key, arr);
    }
    return [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([key, xs]) => ({
        dia: new Date(key).toLocaleDateString("es-SV", { day: "2-digit", month: "2-digit" }),
        minutos: round1(avg(xs)),
      }));
  }, [delivered]);

  const empty = delivered.length === 0;

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:flex sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold uppercase tracking-widest text-primary">Gráficas</h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {RANGE_LABELS[range.preset]} ·{" "}
            {pharmacy === "all" ? "Todas las farmacias" : PHARMACY_LABELS[pharmacy]}
          </p>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap sm:items-end">
          <Select
            value={pharmacy}
            onValueChange={(v) => setPharmacy(v as Pharmacy | "all")}
          >
            <SelectTrigger className="h-11 sm:w-56" aria-label="Filtrar por farmacia">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las farmacias</SelectItem>
              {(Object.keys(PHARMACY_LABELS) as Pharmacy[]).map((p) => (
                <SelectItem key={p} value={p}>
                  {PHARMACY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <RangeFilter value={range} onChange={setRange} />
        </div>
      </div>

      {empty ? (
        <div className="board-panel p-6 text-center text-muted-foreground">
          Aún no hay entregas efectivas en el rango seleccionado
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Tiempo promedio por hora"
          subtitle="Minutos promedio (min) por hora de ingreso"
          note={
            byHour.length < 2 ? null : hourPeaks.peaks.length ? (
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ background: LATE }}
                />
                <strong className="font-bold text-foreground">
                  Pico{hourPeaks.peaks.length > 1 ? "s" : ""} detectado
                  {hourPeaks.peaks.length > 1 ? "s" : ""}:
                </strong>
                {hourPeaks.peaks
                  .map((p) => `${p.hora} (${p.minutos} min · ${p.casos} casos)`)
                  .join(" · ")}
                <span>— promedio del rango {hourPeaks.mean} min</span>
              </span>
            ) : (
              <span>
                Sin picos relevantes: todas las horas están cerca del promedio (
                {hourPeaks.mean} min).
              </span>
            )
          }
        >
          <LineChart data={byHour} margin={{ top: 10, right: 16, bottom: 18, left: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="hora" {...axisProps}>
              <Label
                value="Hora de ingreso (HH:00)"
                position="insideBottom"
                offset={-12}
                fill="var(--muted-foreground)"
                fontSize={11}
              />
            </XAxis>
            <YAxis {...axisProps} unit=" min" width={58}>
              <Label
                value="Minutos"
                angle={-90}
                position="insideLeft"
                fill="var(--muted-foreground)"
                fontSize={11}
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip
              {...tooltipStyle()}
              formatter={(v: number, _n, item: { payload?: { hora?: string } }) => [
                `${v} min${peakHours.has(item?.payload?.hora ?? "") ? " · pico" : ""}`,
                "Promedio",
              ]}
            />
            {hourPeaks.peaks.length ? (
              <ReferenceLine
                y={hourPeaks.threshold}
                stroke={LATE}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              >
                <Label
                  value={`Umbral de pico ${hourPeaks.threshold} min`}
                  position="insideTopRight"
                  fill={LATE}
                  fontSize={10}
                />
              </ReferenceLine>
            ) : null}
            <Line
              type="monotone"
              dataKey="minutos"
              stroke={PRIMARY}
              strokeWidth={2.5}
              dot={(props: {
                cx?: number;
                cy?: number;
                key?: string;
                payload?: { hora?: string };
              }) => {
                const peak = peakHours.has(props.payload?.hora ?? "");
                return (
                  <circle
                    key={props.key ?? props.payload?.hora}
                    cx={props.cx}
                    cy={props.cy}
                    r={peak ? 6 : 3}
                    fill={peak ? LATE : PRIMARY}
                    stroke={peak ? LATE : "none"}
                    strokeWidth={peak ? 6 : 0}
                    strokeOpacity={peak ? 0.22 : 0}
                  />
                );
              }}
            />
          </LineChart>
        </ChartCard>

        <ChartCard
          title="Tiempo promedio por farmacia"
          subtitle="Minutos promedio (min) de entrega"
        >
          <BarChart data={byPharmacy} margin={{ top: 10, right: 16, bottom: 18, left: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="farmacia" {...axisProps} interval={0}>
              <Label
                value="Farmacia"
                position="insideBottom"
                offset={-12}
                fill="var(--muted-foreground)"
                fontSize={11}
              />
            </XAxis>
            <YAxis {...axisProps} unit=" min" width={58}>
              <Label
                value="Minutos"
                angle={-90}
                position="insideLeft"
                fill="var(--muted-foreground)"
                fontSize={11}
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} min`, "Promedio"]} />
            <Bar dataKey="minutos" radius={[6, 6, 0, 0]} fill={PRIMARY} />
          </BarChart>
        </ChartCard>

        <ChartCard title="Pacientes por estado" subtitle="Cantidad de pacientes por semáforo">
          <BarChart data={byStatus} margin={{ top: 10, right: 16, bottom: 18, left: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="estado" {...axisProps} interval={0}>
              <Label
                value={`Estado (verde <${WARN_MINUTES} min · amarillo ${WARN_MINUTES}-${LATE_MINUTES} min · rojo >${LATE_MINUTES} min)`}
                position="insideBottom"
                offset={-12}
                fill="var(--muted-foreground)"
                fontSize={11}
              />
            </XAxis>
            <YAxis {...axisProps} allowDecimals={false} width={58}>
              <Label
                value="Pacientes"
                angle={-90}
                position="insideLeft"
                fill="var(--muted-foreground)"
                fontSize={11}
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} pacientes`, "Total"]} />
            <Bar dataKey="pacientes" radius={[6, 6, 0, 0]}>
              {byStatus.map((s) => (
                <Cell key={s.estado} fill={s.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <ChartCard title="Tendencia diaria" subtitle="Minutos promedio (min) por día">
          <LineChart data={byDay} margin={{ top: 10, right: 16, bottom: 18, left: 4 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="dia" {...axisProps}>
              <Label
                value="Día (dd/mm)"
                position="insideBottom"
                offset={-12}
                fill="var(--muted-foreground)"
                fontSize={11}
              />
            </XAxis>
            <YAxis {...axisProps} unit=" min" width={58}>
              <Label
                value="Minutos"
                angle={-90}
                position="insideLeft"
                fill="var(--muted-foreground)"
                fontSize={11}
                style={{ textAnchor: "middle" }}
              />
            </YAxis>
            <Tooltip {...tooltipStyle()} formatter={(v: number) => [`${v} min`, "Promedio"]} />
            <Line
              type="monotone"
              dataKey="minutos"
              stroke={OK}
              strokeWidth={2.5}
              dot={{ r: 3, fill: OK }}
            />
          </LineChart>
        </ChartCard>
      </div>
    </section>
  );
}
