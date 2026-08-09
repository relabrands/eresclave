import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRD, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/donaciones")({
  component: DonacionesPage,
});

function DonacionesPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "confirmed">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["donations-admin", filter],
    queryFn: async () => {
      let q = supabase.from("donations").select("*").order("created_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("donations").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Actualizado");
    qc.invalidateQueries({ queryKey: ["donations-admin"] });
    qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar esta donación?")) return;
    const { error } = await supabase.from("donations").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminada");
    qc.invalidateQueries({ queryKey: ["donations-admin"] });
    qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Donaciones</h1>
          <p className="text-sm text-muted-foreground">Intenciones de donación recibidas desde el sitio.</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-card border p-1">
          {(["all", "pending", "confirmed"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === f ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`}>
              {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Confirmadas"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-card border shadow-soft overflow-hidden">
        {isLoading && <div className="p-8 text-center text-muted-foreground">Cargando…</div>}
        {data && data.length === 0 && <div className="p-8 text-center text-muted-foreground">No hay donaciones.</div>}
        <ul className="divide-y">
          {data?.map((d) => (
            <li key={d.id} className="p-4 sm:p-5 grid gap-3 sm:grid-cols-[1fr_auto] items-start">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{d.donor_name}</p>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${d.status === "confirmed" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"}`}>
                    {d.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDate(d.created_at)}
                  {d.donor_email && <> · {d.donor_email}</>}
                  {d.donor_phone && <> · {d.donor_phone}</>}
                </p>
                {d.message && <p className="text-sm mt-2 text-foreground/80 italic">"{d.message}"</p>}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <p className="font-display font-bold text-lg text-primary mr-2">{formatRD(Number(d.amount))}</p>
                {d.status === "pending" ? (
                  <button onClick={() => updateStatus(d.id, "confirmed")} title="Confirmar"
                    className="h-9 w-9 grid place-items-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={() => updateStatus(d.id, "pending")} title="Marcar pendiente"
                    className="h-9 w-9 grid place-items-center rounded-lg bg-secondary hover:bg-secondary/70">
                    <Clock className="h-4 w-4" />
                  </button>
                )}
                <button onClick={() => remove(d.id)} title="Eliminar"
                  className="h-9 w-9 grid place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
