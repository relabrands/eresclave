import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/contenido")({
  component: ContenidoPage,
});

function ContenidoPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_content").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      data.forEach((row) => (map[row.key] = row.value));
      return map;
    },
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black">Contenido del sitio</h1>
        <p className="text-sm text-muted-foreground">Edita los textos principales que aparecen en la página pública.</p>
      </div>

      {data && (
        <>
          <Section
            title="Hero (portada)"
            initial={data.hero}
            fields={[
              { key: "badge", label: "Badge superior" },
              { key: "title", label: "Título" },
              { key: "subtitle", label: "Subtítulo", multiline: true },
              { key: "primaryCta", label: "Botón principal" },
              { key: "secondaryCta", label: "Botón secundario" },
            ]}
            onSaved={() => qc.invalidateQueries({ queryKey: ["site-content"] })}
            contentKey="hero"
          />

          <Section
            title="Sobre Eres Clave"
            initial={data.about}
            fields={[
              { key: "title", label: "Título" },
              { key: "intro", label: "Introducción", multiline: true },
            ]}
            onSaved={() => qc.invalidateQueries({ queryKey: ["site-content"] })}
            contentKey="about"
          />

          <Section
            title="Fundador"
            initial={data.founder}
            fields={[
              { key: "name", label: "Nombre" },
              { key: "title", label: "Título / rol" },
              { key: "quote", label: "Frase", multiline: true },
            ]}
            onSaved={() => qc.invalidateQueries({ queryKey: ["site-content"] })}
            contentKey="founder"
          />
        </>
      )}
    </div>
  );
}

function Section({ title, initial, fields, contentKey, onSaved }: {
  title: string;
  initial: Record<string, any>;
  fields: { key: string; label: string; multiline?: boolean }[];
  contentKey: string;
  onSaved: () => void;
}) {
  const [v, setV] = useState<Record<string, any>>(initial ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => setV(initial ?? {}), [initial]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert({ key: contentKey, value: v, updated_at: new Date().toISOString() });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Guardado");
    onSaved();
  };

  return (
    <div className="rounded-2xl bg-card border p-6 shadow-soft">
      <h2 className="font-display font-bold text-lg mb-4">{title}</h2>
      <div className="space-y-4">
        {fields.map((f) => (
          <label key={f.key} className="block">
            <span className="text-sm font-semibold">{f.label}</span>
            {f.multiline ? (
              <textarea rows={3} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            ) : (
              <input value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })}
                className="mt-1.5 w-full px-3 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            )}
          </label>
        ))}
      </div>
      <button onClick={save} disabled={saving}
        className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-60">
        <Save className="h-4 w-4" /> Guardar
      </button>
    </div>
  );
}
