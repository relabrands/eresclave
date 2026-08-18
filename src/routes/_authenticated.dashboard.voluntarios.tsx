import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection, query, onSnapshot, updateDoc, deleteDoc,
  doc, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Loader2, Users, Trash2, Edit, Search, X, Eye,
  MapPin, Phone, Mail, Calendar, Award,
  ShieldCheck, Globe, CheckCircle2, AlertTriangle,
  MessageCircle, ExternalLink, Sparkles, UserCheck,
  Quote, Hash, HeartHandshake
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
  missions?: string[];
  active: boolean;
}

/* ─── MAIN PAGE ─── */
function VoluntariosAdminPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "local" | "digital">("all");
  
  // Modals
  const [viewingVolunteer, setViewingVolunteer] = useState<Volunteer | null>(null);
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
    }, (err) => {
      console.error(err);
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
    setEditActive(v.active ?? true);
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
      toast.success("Voluntario actualizado correctamente.");
      
      // Also update viewing volunteer if it was open
      if (viewingVolunteer?.id === editingVolunteer.id) {
        setViewingVolunteer(prev => prev ? ({
          ...prev,
          name: editName.trim(),
          city: editCity.trim(),
          whatsapp: editWhatsapp.trim(),
          type: editType,
          active: editActive,
          motivation: editMotivation.trim(),
        }) : null);
      }

      setEditingVolunteer(null);
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar los datos.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "volunteers", deleteConfirm.id));
      toast.success(`${deleteConfirm.name} ha sido eliminado de los voluntarios.`);
      if (viewingVolunteer?.id === deleteConfirm.id) {
        setViewingVolunteer(null);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el registro.");
    } finally {
      setDeleting(false);
    }
  };

  const filtered = volunteers.filter(v => {
    const matchSearch = !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      (v.volunteerId && v.volunteerId.toLowerCase().includes(search.toLowerCase())) ||
      (v.whatsapp && v.whatsapp.includes(search));
    const matchType = filterType === "all" || v.type === filterType;
    return matchSearch && matchType;
  });

  const totalLocal = volunteers.filter(v => v.type === "local").length;
  const totalDigital = volunteers.filter(v => v.type === "digital").length;
  const totalActive = volunteers.filter(v => v.active !== false).length;

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "—";
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-DO", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatShortDate = (dateObj: any) => {
    if (!dateObj) return "—";
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
  };

  const cleanPhone = (phone?: string) => {
    if (!phone) return "";
    return phone.replace(/\D/g, "");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#004A45] via-[#006E66] to-[#00897B] text-white p-6 sm:p-8 shadow-lg">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90">
              <HeartHandshake className="h-3.5 w-3.5 text-[#F59E0B]" />
              Impulso Comunitario · Eres Clave
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestión de Voluntarios
            </h1>
            <p className="text-sm text-white/80 max-w-xl leading-relaxed">
              Consulta, administra y da seguimiento a todos los voluntarios activos del Frente Local y Digital.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Registrados</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{volunteers.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total de voluntarios</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activos</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-emerald-600">{totalActive}</p>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Disponibles para misiones
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frente Local 🏘️</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-600 grid place-items-center">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{totalLocal}</p>
          <p className="text-xs text-muted-foreground mt-1">En Las Charcas (operativos)</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Frente Digital 💻</span>
            <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-600 grid place-items-center">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-foreground">{totalDigital}</p>
          <p className="text-xs text-muted-foreground mt-1">Santo Domingo & Diáspora</p>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, ciudad o ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl shadow-sm self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterType("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              filterType === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todos ({volunteers.length})
          </button>
          <button
            onClick={() => setFilterType("local")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
              filterType === "local"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>🏘️</span> Locales ({totalLocal})
          </button>
          <button
            onClick={() => setFilterType("digital")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
              filterType === "digital"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span>💻</span> Digitales ({totalDigital})
          </button>
        </div>
      </div>

      {/* Main Content List / Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-card rounded-3xl border border-border/80">
          <Loader2 className="h-9 w-9 animate-spin text-primary mb-3" />
          <p className="text-sm font-semibold text-muted-foreground">Cargando voluntarios…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border/80 p-8 shadow-sm">
          <div className="h-16 w-16 rounded-3xl bg-secondary/80 text-muted-foreground flex items-center justify-center mx-auto mb-4">
            <Users className="h-8 w-8 opacity-40" />
          </div>
          <h3 className="text-lg font-bold text-foreground">No se encontraron voluntarios</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {volunteers.length === 0
              ? "Aún no hay voluntarios registrados en la plataforma."
              : "No hay coincidencias con los términos de búsqueda o filtros seleccionados."}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="mt-4 px-4 py-2 rounded-xl bg-secondary text-xs font-bold text-foreground hover:bg-secondary/80 transition-colors"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-secondary/30 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-4">Voluntario</th>
                  <th className="px-4 py-4">Frente</th>
                  <th className="px-4 py-4">Ubicación</th>
                  <th className="px-4 py-4">Contacto</th>
                  <th className="px-4 py-4">Misiones</th>
                  <th className="px-4 py-4">Registro</th>
                  <th className="px-4 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-secondary/20 transition-colors group"
                  >
                    {/* Volunteer Name & ID */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#006E66] to-[#004A45] text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <button
                            onClick={() => setViewingVolunteer(v)}
                            className="font-bold text-foreground hover:text-primary transition-colors text-left truncate block max-w-[180px]"
                            title={v.name}
                          >
                            {v.name}
                          </button>
                          <span className="inline-block text-[11px] font-mono text-muted-foreground font-semibold">
                            {v.volunteerId || "#EC-000"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Frente Badge */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full",
                        v.type === "local"
                          ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                      )}>
                        {v.type === "local" ? "🏘️ Local" : "💻 Digital"}
                      </span>
                    </td>

                    {/* City */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-foreground/90 font-medium">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[130px]">{v.city || "Las Charcas"}</span>
                      </div>
                    </td>

                    {/* Contact (Email + Phone) */}
                    <td className="px-4 py-4">
                      <div className="space-y-1">
                        <a
                          href={`mailto:${v.email}`}
                          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors truncate max-w-[170px]"
                          title={v.email}
                        >
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{v.email}</span>
                        </a>
                        {v.whatsapp && (
                          <a
                            href={`https://wa.me/${cleanPhone(v.whatsapp)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1.5 font-medium"
                            title="Chatear por WhatsApp"
                          >
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{v.whatsapp}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Missions Count */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-secondary text-foreground">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        {v.missions?.length || 0}
                      </span>
                    </td>

                    {/* Date Joined */}
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-muted-foreground font-medium">
                      {formatShortDate(v.joinedAt)}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full",
                        v.active !== false
                          ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                          : "bg-muted text-muted-foreground border border-border"
                      )}>
                        {v.active !== false ? (
                          <>
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                            Activo
                          </>
                        ) : (
                          "Inactivo"
                        )}
                      </span>
                    </td>

                    {/* Actions Toolbar */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Eye Button - View Details */}
                        <button
                          onClick={() => setViewingVolunteer(v)}
                          className="h-8 w-8 rounded-xl bg-primary/10 hover:bg-primary hover:text-white text-primary flex items-center justify-center transition-all shadow-xs"
                          title="Ver ficha completa"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Button */}
                        <button
                          onClick={() => openEdit(v)}
                          className="h-8 w-8 rounded-xl bg-secondary hover:bg-amber-500/15 hover:text-amber-700 text-muted-foreground flex items-center justify-center transition-all"
                          title="Editar voluntario"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteConfirm(v)}
                          className="h-8 w-8 rounded-xl bg-secondary hover:bg-red-500/15 hover:text-red-600 text-muted-foreground flex items-center justify-center transition-all"
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

          {/* Mobile Card List View */}
          <div className="md:hidden divide-y divide-border">
            {filtered.map((v) => (
              <div key={v.id} className="p-4 space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#006E66] to-[#004A45] text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                      {v.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <button
                        onClick={() => setViewingVolunteer(v)}
                        className="font-bold text-foreground hover:text-primary text-left text-base leading-tight block"
                      >
                        {v.name}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-mono text-muted-foreground font-semibold">
                          {v.volunteerId || "#EC-000"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {formatShortDate(v.joinedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Eye, Edit, Delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingVolunteer(v)}
                      className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center"
                      title="Ver ficha completa"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEdit(v)}
                      className="h-8 w-8 rounded-xl bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center"
                      title="Editar"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(v)}
                      className="h-8 w-8 rounded-xl bg-secondary text-red-500 hover:bg-red-50 flex items-center justify-center"
                      title="Eliminar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full",
                    v.type === "local"
                      ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                      : "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                  )}>
                    {v.type === "local" ? "🏘️ Frente Local" : "💻 Frente Digital"}
                  </span>

                  <span className={cn(
                    "text-[10px] font-bold px-2.5 py-1 rounded-full",
                    v.active !== false
                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                      : "bg-muted text-muted-foreground border border-border"
                  )}>
                    {v.active !== false ? "Activo" : "Inactivo"}
                  </span>

                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-secondary text-foreground flex items-center gap-1">
                    <Award className="h-3 w-3 text-primary" />
                    {v.missions?.length || 0} misiones
                  </span>
                </div>

                <div className="bg-secondary/40 rounded-xl p-3 space-y-1.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2 text-foreground font-medium">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{v.city || "Las Charcas, Azua"}</span>
                  </p>
                  <p className="flex items-center gap-2 truncate">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{v.email}</span>
                  </p>
                  {v.whatsapp && (
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-medium">{v.whatsapp}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── DETAIL MODAL (EL "OJITO") ─── */}
      {viewingVolunteer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setViewingVolunteer(null)}
        >
          <div
            className="bg-card rounded-3xl border border-border/80 w-full max-w-lg shadow-2xl overflow-hidden my-6"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Banner */}
            <div className="relative bg-gradient-to-br from-[#004A45] via-[#006E66] to-[#00897B] text-white p-6 pb-7">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold tracking-wide">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#F59E0B]" />
                  Ficha Oficial de Voluntario
                </div>
                <button
                  onClick={() => setViewingVolunteer(null)}
                  className="h-8 w-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black text-white shadow-md shrink-0 backdrop-blur-sm">
                  {viewingVolunteer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-white tracking-tight leading-tight truncate">
                    {viewingVolunteer.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 rounded-md bg-white/20 font-mono text-xs font-bold text-white tracking-wider">
                      {viewingVolunteer.volunteerId || "#EC-000"}
                    </span>
                    <span className="text-xs text-white/80 font-medium">
                      {viewingVolunteer.type === "local" ? "🏘️ Frente Local" : "💻 Frente Digital"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Quick Action Contact Bar */}
              <div className="grid grid-cols-2 gap-2.5">
                {viewingVolunteer.whatsapp ? (
                  <a
                    href={`https://wa.me/${cleanPhone(viewingVolunteer.whatsapp)}?text=Hola%20${encodeURIComponent(viewingVolunteer.name)},%20te%20escribimos%20desde%20la%20Fundaci%C3%B3n%20Eres%20Clave`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm active:scale-98"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar WhatsApp
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-secondary text-muted-foreground text-xs font-semibold opacity-60 cursor-not-allowed"
                  >
                    <Phone className="h-4 w-4" /> Sin WhatsApp
                  </button>
                )}

                <a
                  href={`mailto:${viewingVolunteer.email}?subject=Fundaci%C3%B3n%20Eres%20Clave`}
                  className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border hover:bg-secondary text-foreground text-xs font-bold transition-all active:scale-98"
                >
                  <Mail className="h-4 w-4 text-primary" />
                  Enviar Correo
                </a>
              </div>

              {/* Status & Metrics Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/40 rounded-2xl p-3.5 text-center border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Estado</span>
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full",
                    viewingVolunteer.active !== false ? "text-emerald-700 bg-emerald-500/10" : "text-muted-foreground bg-muted"
                  )}>
                    {viewingVolunteer.active !== false ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="bg-secondary/40 rounded-2xl p-3.5 text-center border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Misiones</span>
                  <span className="text-base font-black text-primary flex items-center justify-center gap-1">
                    <Award className="h-4 w-4" />
                    {viewingVolunteer.missions?.length || 0}
                  </span>
                </div>

                <div className="bg-secondary/40 rounded-2xl p-3.5 text-center border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Frente</span>
                  <span className="text-xs font-bold text-foreground block truncate">
                    {viewingVolunteer.type === "local" ? "Local" : "Digital"}
                  </span>
                </div>
              </div>

              {/* Details List */}
              <div className="bg-card rounded-2xl border border-border/80 divide-y divide-border/60 overflow-hidden">
                <div className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <MapPin className="h-4 w-4 text-primary" /> Ubicación
                  </span>
                  <span className="font-bold text-foreground">{viewingVolunteer.city || "Las Charcas, Azua"}</span>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <Mail className="h-4 w-4 text-primary" /> Correo electrónico
                  </span>
                  <span className="font-bold text-foreground truncate max-w-[200px]">{viewingVolunteer.email}</span>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <Phone className="h-4 w-4 text-primary" /> Teléfono / WhatsApp
                  </span>
                  <span className="font-bold text-foreground">{viewingVolunteer.whatsapp || "No registrado"}</span>
                </div>

                <div className="p-3.5 flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground flex items-center gap-2 font-medium">
                    <Calendar className="h-4 w-4 text-primary" /> Fecha de ingreso
                  </span>
                  <span className="font-bold text-foreground">{formatDate(viewingVolunteer.joinedAt)}</span>
                </div>
              </div>

              {/* Motivation Quote Box */}
              {viewingVolunteer.motivation && (
                <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 relative">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1.5">
                    <Quote className="h-3.5 w-3.5" />
                    ¿Por qué se unió a Eres Clave?
                  </div>
                  <p className="text-xs text-foreground/90 leading-relaxed italic">
                    "{viewingVolunteer.motivation}"
                  </p>
                </div>
              )}

              {/* Missions Completed History */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-primary" />
                    Historial de misiones ({viewingVolunteer.missions?.length || 0})
                  </h4>
                </div>

                {viewingVolunteer.missions && viewingVolunteer.missions.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {viewingVolunteer.missions.map((m, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-xs font-medium text-foreground border border-border"
                      >
                        <Sparkles className="h-3 w-3 text-amber-500" />
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-secondary/30 text-center text-xs text-muted-foreground border border-border/40">
                    Aún no ha participado en misiones registradas.
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-border bg-secondary/20 flex gap-2.5 justify-end">
              <button
                onClick={() => {
                  const target = viewingVolunteer;
                  setViewingVolunteer(null);
                  openEdit(target);
                }}
                className="px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-bold text-foreground transition-colors flex items-center gap-2"
              >
                <Edit className="h-3.5 w-3.5" />
                Editar datos
              </button>
              <button
                onClick={() => setViewingVolunteer(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Cerrar ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT MODAL ─── */}
      {editingVolunteer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setEditingVolunteer(null)}
        >
          <div
            className="bg-card rounded-3xl border border-border w-full max-w-md shadow-2xl overflow-hidden my-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <div>
                <h2 className="font-black text-lg text-foreground">Editar voluntario</h2>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {editingVolunteer.volunteerId || "#EC-000"} • {editingVolunteer.email}
                </p>
              </div>
              <button
                onClick={() => setEditingVolunteer(null)}
                className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Nombre completo</label>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: Juan Pérez"
                />
              </div>

              {/* Type / Frente */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Frente de acción</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["local", "digital"] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditType(t)}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2",
                        editType === t
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {t === "local" ? "🏘️ Frente Local" : "💻 Frente Digital"}
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
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Ej: Las Charcas, Azua"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Teléfono / WhatsApp</label>
                <input
                  value={editWhatsapp}
                  onChange={e => setEditWhatsapp(e.target.value)}
                  placeholder="8290000000"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Motivación</label>
                <textarea
                  value={editMotivation}
                  onChange={e => setEditMotivation(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  placeholder="¿Por qué desea ser voluntario?"
                />
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between py-3 px-4 rounded-2xl bg-secondary/50 border border-border">
                <div>
                  <p className="text-xs font-bold text-foreground">Estado Activo</p>
                  <p className="text-[11px] text-muted-foreground">Si está inactivo, no estará disponible para misiones.</p>
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
                    "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                    editActive ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setEditingVolunteer(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving || !editName.trim() || !editCity.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DELETE CONFIRM MODAL ─── */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-card rounded-3xl border border-border w-full max-w-sm shadow-2xl p-6 text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="h-14 w-14 rounded-2xl bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <h2 className="font-black text-lg text-foreground mb-1">¿Eliminar voluntario?</h2>
            <p className="text-sm text-muted-foreground mb-2">
              <strong>{deleteConfirm.name}</strong> ({deleteConfirm.volunteerId || "#EC-000"}) será eliminado de la lista de voluntarios.
            </p>
            <p className="text-xs text-muted-foreground/80 mb-6 bg-secondary/50 p-2.5 rounded-xl">
              Esta acción eliminará sus datos de voluntariado y su registro del panel.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-60 transition-all flex items-center justify-center gap-2 shadow-sm"
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
