import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchDeliveries, type Delivery } from "@/lib/deliveries";

export function useTicker() {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useDeliveries() {
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
  return { rows, isError };
}

export function useClock(now: number) {
  const mounted = now > 0;
  return {
    mounted,
    clock: mounted
      ? new Date(now).toLocaleTimeString("es-SV", { hour12: false })
      : "--:--:--",
    today: mounted
      ? new Date(now).toLocaleDateString("es-SV", {
          weekday: "long",
          day: "2-digit",
          month: "long",
        })
      : "",
  };
}
