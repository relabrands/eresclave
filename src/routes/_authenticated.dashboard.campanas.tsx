import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection, query, onSnapshot, addDoc, serverTimestamp,
  doc, updateDoc, deleteDoc, writeBatch, arrayUnion, orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import {
  Loader2, Plus, Target, Trash2, Edit2, Calendar,
  ExternalLink, HeartHandshake, CheckCircle2, Search,
  X, AlertTriangle, DollarSign, Award,
  Users, ArrowUpRight, Copy, Check, Newspaper, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/campanas")({
  component: CampanasPage,
});

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  pricePerUnit: number;
  unit: string;
  status: "active" | "completed" | "upcoming";
  slug: string;
  type: "backpacks" | "medical";
  eventDate?: string;
}

interface Donation {
  id: string;
  campaignId: string;
  amount: number;
}

interface Application {
  id: string; // volunteer uid
  campaignId: string;
  campaignTitle: string;
  volunteerId: string;
  volunteerName: string;
  volunteerType: "local" | "digital";
  city: string;
  status: "pending" | "approved" | "completed" | "rejected";
  assignedRole?: string;
  appliedAt: any;
}

/** Auto-generate a URL-friendly slug from a title */
function toSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "upcoming" | "completed">("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Volunteers Modal state
  const [volunteersModalOpen, setVolunteersModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [updatesModalOpen, setUpdatesModalOpen] = useState(false);

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState(50);
  const [pricePerUnit, setPricePerUnit] = useState(450);
  const [unit, setUnit] = useState("mochilas");
  const [status, setStatus] = useState<"active" | "completed" | "upcoming">("active");
  const [type, setType] = useState<"backpacks" | "medical">("backpacks");
  const [eventDate, setEventDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const qCamps = query(collection(db, "campaigns"));
    const unsubCamps = onSnapshot(qCamps, (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Error al cargar campañas");
      setLoading(false);
    });

    const qDonations = query(collection(db, "donations"));
    const unsubDonations = onSnapshot(qDonations, (snap) => {
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
    });

    return () => {
      unsubCamps();
      unsubDonations();
    };
  }, []);

  useEffect(() => {
    if (!selectedCampaign) {
      setApplications([]);
      return;
    }
    setAppsLoading(true);
    const q = query(collection(db, "campaigns", selectedCampaign.id, "applications"));
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
      setAppsLoading(false);
    });
    return unsub;
  }, [selectedCampaign]);

  const openVolunteersModal = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setVolunteersModalOpen(true);
  };

  const closeVolunteersModal = () => {
    setVolunteersModalOpen(false);
    setSelectedCampaign(null);
  };

  const openUpdatesModal = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setUpdatesModalOpen(true);
  };

  const closeUpdatesModal = () => {
    setUpdatesModalOpen(false);
    setSelectedCampaign(null);
  };

  const openModal = (camp?: Campaign) => {
    if (camp) {
      setEditingId(camp.id);
      setTitle(camp.title);
      setSlug(camp.slug || "");
      setSlugManual(true);
      setDescription(camp.description);
      setGoal(camp.goal);
      setPricePerUnit(camp.pricePerUnit);
      setUnit(camp.unit);
      setStatus(camp.status);
      setType(camp.type || "backpacks");
      setEventDate(camp.eventDate || "");
    } else {
      setEditingId(null);
      setTitle("");
      setSlug("");
      setSlugManual(false);
      setDescription("");
      setGoal(50);
      setPricePerUnit(450);
      setUnit("mochilas");
      setStatus("active");
      setType("backpacks");
      setEventDate("");
    }
    setModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!slugManual) setSlug(toSlug(val));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) { toast.error("El slug es obligatorio"); return; }
    setSaving(true);
    try {
      const data: Partial<Campaign> = {
        title, slug: slug.trim(), description, goal, pricePerUnit,
        unit, status, type, ...(eventDate ? { eventDate } : {}),
      };
      if (editingId) {
        await updateDoc(doc(db, "campaigns", editingId), data);
        toast.success("Campaña actualizada");
      } else {
        await addDoc(collection(db, "campaigns"), { ...data, createdAt: serverTimestamp() });
        toast.success("Campaña creada");
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la campaña");
    } finally {
      setSaving(false);
    }
  };

  const updateApplicationStatus = async (appId: string, newStatus: Application["status"], role?: string) => {
    if (!selectedCampaign) return;
    try {
      const data: any = { status: newStatus };
      if (role !== undefined) data.assignedRole = role;
      await updateDoc(doc(db, "campaigns", selectedCampaign.id, "applications", appId), data);
      toast.success("Estado actualizado");
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar estado");
    }
  };

  const markMissionCompleted = async (app: Application) => {
    if (!selectedCampaign) return;
    try {
      const batch = writeBatch(db);
      
      // 1. Mark application as completed
      const appRef = doc(db, "campaigns", selectedCampaign.id, "applications", app.id);
      batch.update(appRef, { status: "completed" });

      // 2. Add campaign title to volunteer's missions
      const volRef = doc(db, "volunteers", app.volunteerId);
      batch.update(volRef, { missions: arrayUnion(selectedCampaign.title) });

      await batch.commit();
      toast.success(`Misión completada para ${app.volunteerName} (+1 misión)`);
    } catch (err) {
      console.error(err);
      toast.error("Error al completar misión");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`¿Eliminar la campaña "${title}"?`)) return;
    try {
      await deleteDoc(doc(db, "campaigns", id));
      toast.success("Campaña eliminada");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar");
    }
  };

  const copyLandingLink = (campSlug: string) => {
    const url = `${window.location.origin}/donar/${campSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(campSlug);
    toast.success("Enlace de campaña copiado");
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filtered = campaigns.filter(c => {
    const matchSearch = !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      (c.slug && c.slug.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalActive = campaigns.filter(c => c.status === "active").length;
  const totalUpcoming = campaigns.filter(c => c.status === "upcoming").length;
  const totalCompleted = campaigns.filter(c => c.status === "completed").length;

  const formatRD = (val: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0,
    }).format(val).replace("DOP", "RD$");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-9 w-9 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Cargando campañas…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-7 pb-12">
      {/* ─── HEADER BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#004A45] via-[#006E66] to-[#00897B] text-white p-6 sm:p-8 shadow-lg">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90">
              <Target className="h-3.5 w-3.5 text-[#F59E0B]" />
              Iniciativas de Impacto
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Gestión de Campañas
            </h1>
            <p className="text-sm text-white/80 max-w-xl leading-relaxed">
              Crea, publica y monitorea las metas de recaudación y participación comunitaria de cada campaña.
            </p>
          </div>

          <button
            onClick={() => openModal()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-[#006E66] font-bold text-xs shadow-md hover:bg-white/90 transition-all active:scale-98 shrink-0 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Crear Campaña
          </button>
        </div>
      </div>

      {/* ─── METRIC CARDS ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Total Campañas</span>
          <p className="text-2xl font-black text-foreground">{campaigns.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Iniciativas creadas</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Activas</span>
          <p className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            {totalActive}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Recibiendo donaciones</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Próximas</span>
          <p className="text-2xl font-black text-blue-600">{totalUpcoming}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">En planificación</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">Completadas</span>
          <p className="text-2xl font-black text-purple-600">{totalCompleted}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Metas alcanzadas</p>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, descripción o URL..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-card border border-border rounded-2xl shadow-sm self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              filterStatus === "all" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Todas ({campaigns.length})
          </button>
          <button
            onClick={() => setFilterStatus("active")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              filterStatus === "active" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Activas ({totalActive})
          </button>
          <button
            onClick={() => setFilterStatus("upcoming")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              filterStatus === "upcoming" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Próximas ({totalUpcoming})
          </button>
          <button
            onClick={() => setFilterStatus("completed")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
              filterStatus === "completed" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Completadas ({totalCompleted})
          </button>
        </div>
      </div>

      {/* ─── CAMPAIGNS GRID ─── */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-border p-8 shadow-sm">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-lg font-bold text-foreground">No se encontraron campañas</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
            {campaigns.length === 0 ? "Comienza creando tu primera campaña comunitaria." : "No hay resultados para este filtro."}
          </p>
          {campaigns.length === 0 && (
            <button
              onClick={() => openModal()}
              className="mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all"
            >
              <Plus className="h-4 w-4 inline mr-1" /> Crear primera campaña
            </button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(c => {
            const campDonations = donations.filter(d => d.campaignId === c.id);
            const campRaised = campDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
            const unitsCount = campDonations.length;
            const percent = Math.min(100, Math.round((unitsCount / (c.goal || 1)) * 100));

            return (
              <div
                key={c.id}
                className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Status + Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                        c.status === "active" ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" :
                        c.status === "completed" ? "bg-stone-500/10 text-stone-700 border border-stone-500/20" : "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                      )}>
                        {c.status === "active" ? "Activa" : c.status === "completed" ? "Completada" : "Próxima"}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {c.type === "medical" ? "🩺 Médico" : "🎒 Mochilas"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {/* Volunteers Modal Button */}
                      <button
                        onClick={() => openVolunteersModal(c)}
                        className="px-2.5 py-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
                        title="Ver voluntarios asignados"
                      >
                        <HeartHandshake className="h-3.5 w-3.5" />
                        <span>Misión</span>
                      </button>

                      {/* Updates Modal Button */}
                      <button
                        onClick={() => openUpdatesModal(c)}
                        className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-500/10 hover:bg-blue-600 hover:text-white rounded-xl flex items-center gap-1.5 transition-all shadow-2xs"
                        title="Gestionar actualizaciones"
                      >
                        <Newspaper className="h-3.5 w-3.5" />
                      </button>

                      {/* View Landing */}
                      <a
                        href={`/donar/${c.slug || c.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 w-7 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                        title="Abrir página pública"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>

                      {/* Edit */}
                      <button
                        onClick={() => openModal(c)}
                        className="h-7 w-7 rounded-xl bg-secondary hover:bg-amber-500/15 hover:text-amber-700 text-muted-foreground flex items-center justify-center transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(c.id, c.title)}
                        className="h-7 w-7 rounded-xl bg-secondary hover:bg-red-500/15 hover:text-red-600 text-muted-foreground flex items-center justify-center transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-foreground text-base leading-snug mb-1">{c.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                    {c.description}
                  </p>

                  {/* Event Date (if any) */}
                  {c.eventDate && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3 font-medium">
                      <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "short", year: "numeric" }).format(new Date(c.eventDate))}</span>
                    </div>
                  )}

                  {/* Public Slug Tag */}
                  <div className="flex items-center gap-1.5 mb-4">
                    <span className="text-[11px] font-mono text-muted-foreground bg-secondary/70 px-2.5 py-1 rounded-xl truncate max-w-[200px]">
                      /donar/{c.slug || c.id}
                    </span>
                    <button
                      onClick={() => copyLandingLink(c.slug || c.id)}
                      className="h-6 w-6 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
                      title="Copiar enlace"
                    >
                      {copiedSlug === (c.slug || c.id) ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Progress Bar & Financials */}
                <div className="space-y-2 pt-3.5 border-t border-border/70">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-foreground">
                      {unitsCount} de {c.goal} {c.unit}
                    </span>
                    <span className="text-primary font-black">{percent}%</span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#006E66] to-[#00897B] transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Recaudado</p>
                      <p className="font-bold text-foreground">{formatRD(campRaised)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">Costo / unidad</p>
                      <p className="font-bold text-primary">RD$ {c.pricePerUnit}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CREATE / EDIT MODAL ─── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200" onClick={() => setModalOpen(false)}>
          <div className="bg-card rounded-3xl border border-border max-w-lg w-full shadow-2xl p-6 my-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
              <div>
                <h2 className="text-lg font-black text-foreground">{editingId ? "Editar campaña" : "Nueva campaña"}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Configura los detalles de la iniciativa</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Tipo de campaña</label>
                <div className="grid grid-cols-2 gap-2">
                  {([["backpacks", "🎒 Mochilas Escolares"], ["medical", "🩺 Operativo Médico"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setType(val);
                        if (val === "medical") { setUnit("pacientes"); setPricePerUnit(500); }
                        else { setUnit("mochilas"); setPricePerUnit(450); }
                      }}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-1.5",
                        type === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-secondary"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Título de la campaña</label>
                <input
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  required
                  placeholder="ej. 50 Mochilas para Las Charcas"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Enlace de la campaña (Slug)</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono bg-secondary px-3 py-2.5 rounded-xl border border-border whitespace-nowrap">
                    /donar/
                  </span>
                  <input
                    value={slug}
                    onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                    required
                    placeholder="nombre-de-campana"
                    className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Descripción</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  rows={2}
                  placeholder="Describe la causa y el impacto de esta campaña…"
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
              </div>

              {/* Goal + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Meta (cantidad)</label>
                  <input
                    type="number"
                    value={goal}
                    onChange={e => setGoal(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Nombre de unidad</label>
                  <input
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="mochilas / pacientes"
                  />
                </div>
              </div>

              {/* Price + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Costo por unidad (RD$)</label>
                  <input
                    type="number"
                    value={pricePerUnit}
                    onChange={e => setPricePerUnit(Number(e.target.value))}
                    required
                    min={1}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Estado</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="active">Activa</option>
                    <option value="upcoming">Próximamente</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              </div>

              {/* Event Date */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Fecha del evento / límite (opcional)</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-bold border border-border rounded-xl hover:bg-secondary transition-colors text-muted-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-xs font-bold bg-primary text-primary-foreground rounded-xl flex justify-center items-center gap-2 hover:opacity-90 transition-all shadow-sm"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : "Guardar campaña"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── VOLUNTEERS MODAL ─── */}
      {volunteersModalOpen && selectedCampaign && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={closeVolunteersModal}
        >
          <div
            className="bg-card rounded-3xl border border-border max-w-2xl w-full shadow-2xl p-6 my-6 max-h-[90vh] overflow-y-auto flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start pb-4 mb-4 border-b border-border">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-2">
                  <HeartHandshake className="h-3.5 w-3.5" />
                  Misión de Voluntariado
                </div>
                <h2 className="text-xl font-black text-foreground">{selectedCampaign.title}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gestiona las solicitudes de voluntarios para esta iniciativa ({applications.length} postulados)
                </p>
              </div>
              <button
                onClick={closeVolunteersModal}
                className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {appsLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary mb-2" />
                <p className="text-xs text-muted-foreground">Cargando solicitudes…</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-14 border border-dashed border-border rounded-2xl p-6">
                <HeartHandshake className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
                <h4 className="text-sm font-bold text-foreground">No hay voluntarios postulados aún</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
                  Cuando los voluntarios hagan clic en "Quiero ayudar" en su perfil, aparecerán aquí para que les asignes su rol.
                </p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {applications.map(app => (
                  <div key={app.id} className="border border-border/80 rounded-2xl p-4 bg-background shadow-xs space-y-3">
                    <div className="flex justify-between items-start flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#006E66] to-[#004A45] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
                          {app.volunteerName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                            {app.volunteerName}
                            <span className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              app.volunteerType === "local" ? "bg-amber-500/10 text-amber-700" : "bg-blue-500/10 text-blue-700"
                            )}>
                              {app.volunteerType === "local" ? "🏘️ Local" : "💻 Digital"}
                            </span>
                          </h4>
                          <p className="text-xs text-muted-foreground">{app.city || "Las Charcas"}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {app.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateApplicationStatus(app.id, "approved")}
                              className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => updateApplicationStatus(app.id, "rejected")}
                              className="text-xs font-bold px-3 py-1.5 bg-secondary hover:bg-red-50 text-red-600 rounded-xl transition-colors"
                            >
                              Rechazar
                            </button>
                          </>
                        )}

                        {app.status === "approved" && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              placeholder="Rol (ej. Logística)"
                              defaultValue={app.assignedRole}
                              onBlur={(e) => {
                                if (e.target.value !== app.assignedRole) {
                                  updateApplicationStatus(app.id, "approved", e.target.value);
                                }
                              }}
                              className="text-xs px-3 py-1.5 border border-border rounded-xl w-36 bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <button
                              onClick={() => markMissionCompleted(app)}
                              className="text-xs font-bold px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 rounded-xl flex items-center gap-1.5 shadow-xs transition-all active:scale-98"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar misión
                            </button>
                          </div>
                        )}

                        {app.status === "completed" && (
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Misión completada (+1)
                          </span>
                        )}

                        {app.status === "rejected" && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-xl">
                            Rechazada
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Updates Modal */}
      {updatesModalOpen && selectedCampaign && (
        <CampaignUpdatesModal
          campaign={selectedCampaign}
          onClose={closeUpdatesModal}
        />
      )}
    </div>
  );
}

function CampaignUpdatesModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "", date: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "campaigns", campaign.id, "updates"), orderBy("date", "desc"));
    return onSnapshot(q, snap => {
      setUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, [campaign.id]);

  const handleSave = async () => {
    if (!form.title || !form.body || !form.date) return toast.error("Completa todos los campos obligatorios");
    setSaving(true);
    try {
      const data = { ...form, createdAt: serverTimestamp() };
      if (editingId) {
        await updateDoc(doc(db, "campaigns", campaign.id, "updates", editingId), data);
        toast.success("Actualización guardada");
      } else {
        await addDoc(collection(db, "campaigns", campaign.id, "updates"), data);
        toast.success("Actualización publicada");
      }
      setFormOpen(false);
    } catch (e: any) { toast.error("Error: " + e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta actualización?")) return;
    try {
      await deleteDoc(doc(db, "campaigns", campaign.id, "updates", id));
      toast.success("Eliminada");
    } catch (e: any) { toast.error("Error: " + e.message); }
  };

  const openNew = () => { setEditingId(null); setForm({ title: "", body: "", date: new Date().toISOString().split("T")[0], imageUrl: "" }); setFormOpen(true); };
  const openEdit = (u: any) => { setEditingId(u.id); setForm({ title: u.title, body: u.body, date: u.date, imageUrl: u.imageUrl || "" }); setFormOpen(true); };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-background rounded-3xl border border-border w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:px-6 border-b border-border bg-card shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-blue-600" />
              Actualizaciones de Campaña
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{campaign.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-secondary/10">
          {formOpen ? (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="font-bold text-foreground mb-4">{editingId ? "Editar" : "Nueva"} actualización</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Título *</label>
                  <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:border-primary" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Fecha *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:border-primary" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">Mensaje *</label>
                  <textarea rows={4} value={form.body} onChange={e => setForm(f => ({...f, body: e.target.value}))} className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:border-primary resize-none" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-foreground mb-1 block">URL de Imagen (Opcional)</label>
                  <input value={form.imageUrl} onChange={e => setForm(f => ({...f, imageUrl: e.target.value}))} placeholder="/gallery/foto.jpeg" className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl shadow-sm hover:opacity-90 disabled:opacity-50">
                  {saving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors">
                  <Plus className="h-4 w-4" /> Nueva actualización
                </button>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : updates.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-2xl border border-border">
                  <Newspaper className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="font-semibold">Sin actualizaciones</p>
                  <p className="text-xs text-muted-foreground">Comparte el progreso de la campaña con los donantes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {updates.map(u => (
                    <div key={u.id} className="bg-card rounded-2xl border border-border p-4 flex gap-4">
                      {u.imageUrl ? (
                        <img src={u.imageUrl} alt="" className="w-20 h-20 object-cover rounded-xl shrink-0 bg-secondary" />
                      ) : (
                        <div className="w-20 h-20 bg-secondary rounded-xl shrink-0 flex items-center justify-center text-muted-foreground"><ImageIcon className="h-6 w-6 opacity-50" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{u.date}</p>
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEdit(u)} className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => handleDelete(u.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        <h4 className="font-bold text-sm text-foreground truncate">{u.title}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{u.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
