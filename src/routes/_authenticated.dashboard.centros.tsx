import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/centros")({
  component: CentrosPage,
});

type Center = {
  id?: string;
  name: string;
  address: string;
  city: string;
  hours: string;
  phone: string;
  contact_person: string;
  notes: string;
  active: boolean;
};

const empty: Center = { name: "", address: "", city: "Las Charcas", hours: "", phone: "", contact_person: "", notes: "", active: true };

function CentrosPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Center | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["centers-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drop_off_centers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const save = async (c: Center) => {
    if (!c.name || !c.address) return toast.error("Nombre y dirección son requeridos");
    const payload = { ...c };
    delete (payload as any).id;
    const res = c.id
      ? await supabase.from("drop_off_centers").update(payload).eq("id", c.id)
      : await supabase.from("drop_off_centers").insert(payload);
    if (res.error) return toast.error(res.error.message);
    toast.success(c.id ? "Centro actualizado" : "Centro creado");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["centers-admin"] });
    qc.invalidateQueries({ queryKey: ["centers-public"] });
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este centro?")) return;
    const { error } = await supabase.from("drop_off_centers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Eliminado");
    qc.invalidateQueries({ queryKey: ["centers-admin"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black">Centros de acopio</h1>
          <p className="text-sm text-muted-foreground">Lugares donde la gente puede dejar útiles físicos.</p>
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
              <h3 className="font-display font-bold">{c.name}</h3>
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                {c.active ? "activo" : "inactivo"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{c.address}</p>
            {c.hours && <p className="text-xs mt-2">⏰ {c.hours}</p>}
            {c.phone && <p className="text-xs">📞 {c.phone}</p>}
            {c.contact_person && <p className="text-xs">👤 {c.contact_person}</p>}
            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <button onClick={() => setEditing(c as Center)}
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

      {editing && <Modal value={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}

function Modal({ value, onClose, onSave }: { value: Center; onClose: () => void; onSave: (c: Center) => void }) {
  const [v, setV] = useState(value);
  const set = <K extends keyof Center>(k: K, val: Center[K]) => setV((s) => ({ ...s, [k]: val }));
  return (
    <div className="fixed inset-0 z-50 bg-black/50 grid place-items-end sm:place-items-center p-4" onClick={onClose}>
      <div className="bg-card rounded-3xl w-full max-w-lg p-6 shadow-card max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-black text-xl">{v.id ? "Editar centro" : "Nuevo centro"}</h3>
          <button onClick={onClose} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-4">
          <Field label="Nombre" value={v.name} onChange={(s) => set("name", s)} />
          <Field label="Dirección" value={v.address} onChange={(s) => set("address", s)} />
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ciudad" value={v.city} onChange={(s) => set("city", s)} />
            <Field label="Teléfono" value={v.phone} onChange={(s) => set("phone", s)} />
          </div>
          <Field label="Horarios" value={v.hours} onChange={(s) => set("hours", s)} />
          <Field label="Persona de contacto" value={v.contact_person} onChange={(s) => set("contact_person", s)} />
          <Field label="Notas" value={v.notes} onChange={(s) => set("notes", s)} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={v.active} onChange={(e) => set("active", e.target.checked)} />
            Activo (visible en el sitio público)
          </label>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border font-medium">Cancelar</button>
          <button onClick={() => onSave(v)} className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold">Guardar</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (s: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
    </label>
  );
}
