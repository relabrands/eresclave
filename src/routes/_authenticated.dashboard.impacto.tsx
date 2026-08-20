import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, Eye, EyeOff, Loader2, X, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Story } from "../routes/impacto-real.index";

export const Route = createFileRoute("/_authenticated/dashboard/impacto")({
  component: ImpactoAdminPage,
});

const CATEGORIES = [
  { value: "mochilas", label: "🎒 Mochilas" },
  { value: "raciones", label: "🍲 Raciones" },
  { value: "medico", label: "🩺 Médico" },
  { value: "otro", label: "📦 Otro" },
];

const EMPTY_FORM = { personName: "", quote: "", description: "", category: "mochilas" as Story["category"], sector: "", imageUrl: "", published: true, slug: "" };

function toSlug(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
}

function ImpactoAdminPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "stories"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => {
      setStories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Story)));
      setLoading(false);
    });
  }, []);

  const openNew = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setModalOpen(true); };
  const openEdit = (s: Story) => { setEditingId(s.id); setForm({ personName: s.personName, quote: s.quote, description: s.description, category: s.category, sector: s.sector, imageUrl: s.imageUrl, published: s.published, slug: s.slug ?? "" }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.personName.trim() || !form.quote.trim()) { toast.error("Nombre y cita son obligatorios"); return; }
    setSaving(true);
    const data = { ...form, slug: form.slug.trim() || toSlug(form.personName) };
    try {
      if (editingId) {
        await updateDoc(doc(db, "stories", editingId), data);
        toast.success("Historia actualizada");
      } else {
        await addDoc(collection(db, "stories"), { ...data, createdAt: serverTimestamp() });
        toast.success("Historia creada");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error("Error al guardar: " + e.message);
    } finally { setSaving(false); }
  };

  const handleTogglePublish = async (s: Story) => {
    try {
      await updateDoc(doc(db, "stories", s.id), { published: !s.published });
      toast.success(s.published ? "Historia ocultada" : "Historia publicada");
    } catch (e: any) { toast.error("Error: " + e.message); }
  };

  const handleDelete = async (s: Story) => {
    if (!confirm(`¿Eliminar la historia de "${s.personName}"? Esta acción no se puede deshacer.`)) return;
    try { await deleteDoc(doc(db, "stories", s.id)); toast.success("Historia eliminada"); }
    catch (e: any) { toast.error("Error: " + e.message); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Flame className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-black text-foreground">Historias de Impacto</h1>
          </div>
          <p className="text-sm text-muted-foreground">Gestiona las historias que aparecen en la página <Link to="/impacto-real" className="text-primary hover:underline">/impacto-real</Link></p>
        </div>
        <button onClick={openNew} className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm hover:opacity-90 transition-all">
          <Plus className="h-4 w-4" /> Nueva historia
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stories.length },
          { label: "Publicadas", value: stories.filter(s => s.published).length },
          { label: "Ocultas", value: stories.filter(s => !s.published).length },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-4">
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : stories.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <Flame className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-semibold text-foreground mb-1">No hay historias aún</p>
          <p className="text-sm text-muted-foreground mb-4">Crea la primera historia de impacto para mostrar en la página pública.</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
            <Plus className="h-4 w-4" /> Crear primera historia
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stories.map(s => (
            <div key={s.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
              {s.imageUrl && (
                <img src={s.imageUrl} alt={s.personName} className="h-14 w-14 rounded-xl object-cover shrink-0 border border-border" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-bold text-sm text-foreground">{s.personName}</p>
                  <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded-full", s.published ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-600")}>
                    {s.published ? "Publicada" : "Oculta"}
                  </span>
                  <span className="text-[10px] text-muted-foreground border border-border px-2 py-0.5 rounded-full">{CATEGORIES.find(c => c.value === s.category)?.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">"{s.quote}"</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">📍 {s.sector} · /impacto-real/{s.slug ?? s.id}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => handleTogglePublish(s)} title={s.published ? "Ocultar" : "Publicar"} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  {s.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button onClick={() => openEdit(s)} title="Editar" className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(s)} title="Eliminar" className="p-2 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-2xl border border-border w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-bold text-foreground">{editingId ? "Editar historia" : "Nueva historia de impacto"}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Nombre de la persona *</label>
                  <input value={form.personName} onChange={e => setForm(f => ({ ...f, personName: e.target.value }))} placeholder="Ej: Doña Carmen" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Story["category"] }))} className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card">
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Sector / Barrio</label>
                  <input value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} placeholder="Ej: Sector Central" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Cita textual *</label>
                  <input value={form.quote} onChange={e => setForm(f => ({ ...f, quote: e.target.value }))} placeholder="Lo que dijo esta persona en sus propias palabras..." className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Descripción</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} placeholder="Cuenta la historia completa. Usa doble salto de línea para separar párrafos." className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">URL de la imagen</label>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} placeholder="https://... o /gallery/entrega-1.jpeg" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground mb-1.5 block">Slug (URL personalizada)</label>
                  <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="dona-carmen (auto si vacío)" className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 bg-card font-mono" />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <button type="button" onClick={() => setForm(f => ({ ...f, published: !f.published }))} className={cn("relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none", form.published ? "bg-primary" : "bg-border")}>
                    <span className={cn("pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out", form.published ? "translate-x-5" : "translate-x-0")} />
                  </button>
                  <span className="text-sm text-foreground font-medium">{form.published ? "Publicada" : "Oculta"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-border">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:opacity-90 disabled:opacity-60 transition-all">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Guardando..." : editingId ? "Guardar cambios" : "Crear historia"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
