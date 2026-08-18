import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection, query, onSnapshot, updateDoc, deleteDoc,
  doc, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Loader2, Users, Trash2, Edit, Search, X,
  MapPin, Phone, Mail, Calendar, Award,
  ShieldCheck, Globe, CheckCircle2, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/voluntarios")({
  component: VoluntariosAdminPage,
});

interface Volunteer {
  id: string;
  uid: string;
  name: string;
  email: string;
  type: "local" | "digital";
  city: string;
  whatsapp?: string;
  motivation?: string;
  volunteerId: string;
  joinedAt: any;
  missions: string[];
  active: boolean;
}

/* ─── MAIN PAGE ─── */
function VoluntariosAdminPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "local" | "digital">("all");
  const [editingVolunteer, setEditingVolunteer] = useState<Volunteer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Volunteer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [editType, setEditType] = useState<"local" | "digital">("local");
  const [editActive, setEditActive] = useState(true);
  const [editMotivation, setEditMotivation] = useState("");

  useEffect(() => {
    const q = query(collection(db, "volunteers"), orderBy("joinedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Volunteer)));
      setLoading(false);
    }, () => {
      toast.error("Error al cargar voluntarios");
      setLoading(false);
    });
    return unsub;
  }, []);

  const openEdit = (v: Volunteer) => {
    setEditingVolunteer(v);
    setEditName(v.name);
    setEditCity(v.city);
    setEditWhatsapp(v.whatsapp || "");
    setEditType(v.type);
    setEditActive(v.active);
    setEditMotivation(v.motivation || "");
  };

  const handleSaveEdit = async () => {
    if (!editingVolunteer) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "volunteers", editingVolunteer.id), {
        name: editName.trim(),
        city: editCity.trim(),
        whatsapp: editWhatsapp.trim(),
        type: editType,
        active: editActive,
        motivation: editMotivation.trim(),
      });
      toast.success("Voluntario actualizado.");
      setEditingVolunteer(null);
    } catch {
      toast.error("Error al actualizar.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "volunteers", deleteConfirm.id));
      toast.success(`${deleteConfirm.name} eliminado del Escuadrón.`);
      setDeleteConfirm(null);
    } catch {
      toast.error("Error al eliminar.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = volunteers.filter(v => {
    const matchSearch = !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      v.volunteerId.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || v.type === filterType;
    return matchSearch && matchType;
  });

  const totalLocal = volunteers.filter(v => v.type === "local").length;
  const totalDigital = volunteers.filter(v => v.type === "digital").length;
  const totalActive = volunteers.filter(v => v.active).length;

  const joinedDate = (v: Volunteer) =>
    v.joinedAt?.toDate
      ? v.joinedAt.toDate().toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" })
      : "—";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Escuadrón de Voluntarios</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los voluntarios registrados en la fundación.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: volunteers.length, icon: <Users className="h-4 w-4" /> },
          { label: "Activos", value: totalActive, icon: <CheckCircle2 className="h-4 w-4" /> },
          { label: "Locales 🏘️", value: totalLocal, icon: <MapPin className="h-4 w-4" /> },
          { label: "Digitales 💻", value: totalDigital, icon: <Globe className="h-4 w-4" /> },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              {s.icon}
              <span className="text-xs font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, ciudad o ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "local", "digital"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-semibold transition-all",
                filterType === t
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "Todos" : t === "local" ? "🏘️ Locales" : "💻 Digitales"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-semibold">
            {volunteers.length === 0 ? "No hay voluntarios registrados aún." : "Sin resultados para esta búsqueda."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3.5">Voluntario</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5">Frente</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5">Ciudad</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5">Contacto</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5">Ingresó</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-4 py-3.5">Estado</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3.5">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={v.id} className={cn("border-b border-border last:border-0 hover:bg-secondary/30 transition-colors", i % 2 === 0 ? "" : "bg-secondary/10")}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{v.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{v.volunteerId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                        v.type === "local" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                      )}>
                        {v.type === "local" ? "🏘️ Local" : "💻 Digital"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-foreground">{v.city}</td>
                    <td className="px-4 py-4">
                      <div className="space-y-0.5">
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {v.email}
                        </p>
                        {v.whatsapp && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {v.whatsapp}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {joinedDate(v)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                        v.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                      )}>
                        {v.active ? <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" /> Activo</> : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(v)}
                          className="h-8 w-8 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
                          title="Editar voluntario"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(v)}
                          className="h-8 w-8 rounded-lg bg-secondary hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-colors"
                          title="Eliminar voluntario"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-border">
            {filtered.map(v => (
              <div key={v.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {v.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{v.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{v.volunteerId}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(v)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirm(v)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                    v.type === "local" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {v.type === "local" ? "🏘️ Local" : "💻 Digital"}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full",
                    v.active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  )}>
                    {v.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3 w-3" /> {v.city}</p>
                  <p className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {v.email}</p>
                  {v.whatsapp && <p className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {v.whatsapp}</p>}
                  <p className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {joinedDate(v)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editingVolunteer && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setEditingVolunteer(null)}>
          <div className="bg-card rounded-3xl border border-border w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <div>
                <h2 className="font-black text-lg text-foreground">Editar voluntario</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{editingVolunteer.volunteerId}</p>
              </div>
              <button onClick={() => setEditingVolunteer(null)} className="h-8 w-8 rounded-lg hover:bg-secondary flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Nombre</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Frente</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["local", "digital"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditType(t)}
                      className={cn(
                        "py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                        editType === t ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {t === "local" ? "🏘️ Local" : "💻 Digital"}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Ciudad / Comunidad</label>
                <input
                  value={editCity}
                  onChange={e => setEditCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">WhatsApp</label>
                <input
                  value={editWhatsapp}
                  onChange={e => setEditWhatsapp(e.target.value)}
                  placeholder="+1 (809) 000-0000"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Motivación</label>
                <textarea
                  value={editMotivation}
                  onChange={e => setEditMotivation(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-secondary/60">
                <div>
                  <p className="text-sm font-semibold text-foreground">Estado activo</p>
                  <p className="text-xs text-muted-foreground">Si está inactivo, no aparece como voluntario activo.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    editActive ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                    editActive ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setEditingVolunteer(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim() || !editCity.trim()}
                className="flex-1 py-2.5 rounded-xl bg-accent text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-card rounded-3xl border border-border w-full max-w-sm shadow-xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="font-black text-lg text-foreground mb-1">¿Eliminar voluntario?</h2>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>{deleteConfirm.name}</strong> ({deleteConfirm.volunteerId}) será eliminado del Escuadrón.
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Esta acción no elimina su cuenta de Firebase. Solo remueve sus datos de voluntario.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {deleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Eliminando…</> : <><Trash2 className="h-4 w-4" /> Eliminar</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
