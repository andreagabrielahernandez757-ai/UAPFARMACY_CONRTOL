import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RANGE_LABELS, type RangePreset, type RangeValue } from "@/lib/range";

export function RangeFilter({
  value,
  onChange,
  className = "",
}: {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
  className?: string;
}) {
  const set = (patch: Partial<RangeValue>) => onChange({ ...value, ...patch });

  return (
    <div className={`grid gap-3 sm:flex sm:flex-wrap sm:items-end ${className}`}>
      <Select
        value={value.preset}
        onValueChange={(v) => set({ preset: v as RangePreset })}
      >
        <SelectTrigger className="h-11 sm:w-52" aria-label="Filtrar por fecha">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(RANGE_LABELS) as RangePreset[]).map((p) => (
            <SelectItem key={p} value={p}>
              {RANGE_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.preset === "custom" ? (
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
          <Input
            type="date"
            value={value.from}
            onChange={(e) => set({ from: e.target.value })}
            className="tabular h-11"
            aria-label="Fecha desde"
          />
          <Input
            type="time"
            value={value.fromTime}
            onChange={(e) => set({ fromTime: e.target.value })}
            className="tabular h-11"
            aria-label="Hora desde"
          />
          <Input
            type="date"
            value={value.to}
            onChange={(e) => set({ to: e.target.value })}
            className="tabular h-11"
            aria-label="Fecha hasta"
          />
          <Input
            type="time"
            value={value.toTime}
            onChange={(e) => set({ toTime: e.target.value })}
            className="tabular h-11"
            aria-label="Hora hasta"
          />
        </div>
      ) : null}
    </div>
  );
}
