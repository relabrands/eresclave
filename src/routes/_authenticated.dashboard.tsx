import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HandCoins, Users, MapPin, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRD, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Overview,
});

function Overview() {
  const { data } = useQuery({
    queryKey: ["dashboard-overview"],
    queryFn: async () => {
      const [donations, centers, children] = await Promise.all([
        supabase.from("donations").select("amount, status, created_at, donor_name").order("created_at", { ascending: false }),
        supabase.from("drop_off_centers").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("sponsorship_children").select("id", { count: "exact", head: true }).eq("active", true),
      ]);
      const list = donations.data ?? [];
      const total = list.reduce((acc, d) => acc + Number(d.amount), 0);
      const pending = list.filter((d) => d.status === "pending").length;
      return {
        total,
        count: list.length,
        pending,
        centers: centers.count ?? 0,
        children: children.count ?? 0,
        recent: list.slice(0, 6),
      };
    },
  });

  const cards = [
    { label: "Donaciones totales", value: data ? formatRD(data.total) : "—", Icon: HandCoins, accent: "text-accent" },
    { label: "Donaciones registradas", value: data?.count ?? "—", Icon: TrendingUp, accent: "text-primary" },
    { label: "Apadrinables activos", value: data?.children ?? "—", Icon: Users, accent: "text-primary" },
    { label: "Centros de acopio", value: data?.centers ?? "—", Icon: MapPin, accent: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">Resumen</h1>
        <p className="text-muted-foreground text-sm">Vista general de la iniciativa Eres Clave.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl bg-card border p-4 sm:p-5 shadow-soft">
            <c.Icon className={`h-5 w-5 ${c.accent}`} />
            <p className="mt-3 text-2xl sm:text-3xl font-display font-black">{c.value}</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border shadow-soft">
        <div className="p-5 border-b flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold">Donaciones recientes</h2>
            <p className="text-xs text-muted-foreground">Últimas 6 intenciones registradas</p>
          </div>
          {data && data.pending > 0 && (
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-accent/15 text-accent">{data.pending} pendientes</span>
          )}
        </div>
        <ul className="divide-y">
          {(data?.recent ?? []).map((d, i) => (
            <li key={i} className="p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{d.donor_name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(d.created_at)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-display font-bold text-primary">{formatRD(Number(d.amount))}</p>
                <p className="text-[11px] text-muted-foreground uppercase">{d.status}</p>
              </div>
            </li>
          ))}
          {data && data.recent.length === 0 && (
            <li className="p-8 text-center text-sm text-muted-foreground">Aún no hay donaciones registradas.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
