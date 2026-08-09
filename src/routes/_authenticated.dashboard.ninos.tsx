import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatRD } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/ninos")({
  component: NinosPage,
});

type Child = {
  id?: string;
  name: string;
  age: number | null;
  story: string;
  monthly_amount: number;
  photo_url: string;
  sponsored: boolean;
  active: boolean;
};

const empty: Child = { name: "", age: null, story: "", monthly_amount: 500, photo_url: "", sponsored: false, active: true };

function NinosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Child | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["children-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sponsorship_children").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = async (c: Child) => {
    if (!c.name) return toast.error("Nombre requerido");
    const payload: any = { ...c };
    delete payload.id;
    payload.age = c.age ? Number(c.age) : null;
    payload.monthly_amount = Number(c.monthly_amount) || 0;
    const res = c.id
      ? await supabase.from("sponsorship_children").update(payload).eq("id", c.id)
      : await supabase.from("sponsorship_children").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success("Guardado");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["children-admin"] });
    qc.invalidateQueries({ queryKey: ["children-public"] });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar?")) return;
    const { error } = await supabase.from("sponsorship_children").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    qc.invalidateQueries({ queryKey: ["children-admin"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Jóvenes apadrinables</h1>
          <p className="text-sm text-muted-foreground">Aparecen en la página pública de donaciones.</p>
        </div>
        <button onClick={() => setEditing(empty)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="h-4 w-4" /> Nuevo
        </button>
      </div>

      {isLoading && <p className="text-muted-foreground">Cargando…</p>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.map((c) => (
          <div key={c.id} className="rounded-2xl bg-card border p-5 shadow-soft">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-bold">{c.name}{c.age ? `, ${c.age}` : ""}</h3>
                <p className="text-xs text-primary font-semibold mt-0.5">{formatRD(Number(c.monthly_amount))}/mes</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {c.sponsored && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-accent/15 text-accent">apadrinado</span>}
                {!c.active && <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">oculto</span>}
              </div>
            </div>
            {c.story && <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{c.story}</p>}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <button onClick={() => setEditing(c as Child)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/70">
                <Pencil className="h-3.5 w-3.5" /> Editar
              </button>
              <button onClick={() => remove(c.id)}
                className="h-9 w-9 grid place-items-center rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end sm:place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-3xl w-full max-w-lg p-6 shadow-card max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-black text-xl">{editing.id ? "Editar" : "Nuevo joven"}</h3>
              <button onClick={() => setEditing(null)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary"><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-4">
              <Field label="Nombre" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
              <div className="grid grid-cols-2 gap-4">
                <Field label="Edad" type="number" value={editing.age?.toString() ?? ""} onChange={(v) => setEditing({ ...editing, age: v ? Number(v) : null })} />
                <Field label="Monto mensual (RD$)" type="number" value={String(editing.monthly_amount)} onChange={(v) => setEditing({ ...editing, monthly_amount: Number(v) || 0 })} />
              </div>
              <label className="block">
                <span className="text-sm font-semibold">Historia</span>
                <textarea value={editing.story} onChange={(e) => setEditing({ ...editing, story: e.target.value })} rows={4}
                  className="mt-1.5 w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </label>
              <Field label="URL de foto (opcional)" value={editing.photo_url} onChange={(v) => setEditing({ ...editing, photo_url: v })} />
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Activo
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={editing.sponsored} onChange={(e) => setEditing({ ...editing, sponsored: e.target.checked })} /> Ya apadrinado
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 rounded-lg border font-medium">Cancelar</button>
              <button onClick={() => save(editing)} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (s: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
