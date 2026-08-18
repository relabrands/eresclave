import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, writeBatch, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Plus, Target, Trash2, Edit2, Calendar, ExternalLink, HeartHandshake, CheckCircle2 } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Volunteers Modal state
  const [volunteersModalOpen, setVolunteersModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

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
    const q = query(collection(db, "campaigns"));
    const unsub = onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Error al cargar campañas");
      setLoading(false);
    });
    return unsub;
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
      toast.success(`Misión completada para ${app.volunteerName}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al completar misión");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta campaña? Las donaciones asociadas quedarán huérfanas.")) return;
    try {
      await deleteDoc(doc(db, "campaigns", id));
      toast.success("Campaña eliminada");
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-foreground">Campañas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona las campañas activas para donaciones.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Crear campaña
        </button>
      </div>

      {campaigns.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
          <Target className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground">No hay campañas</h3>
          <p className="text-sm text-muted-foreground mt-1">Crea una campaña para empezar a recibir donaciones.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map(c => (
            <div key={c.id} className="bg-card rounded-2xl p-5 border shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                    c.status === "active" ? "bg-emerald-100 text-emerald-700" :
                    c.status === "completed" ? "bg-stone-100 text-stone-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {c.status === "active" ? "Activa" : c.status === "completed" ? "Completada" : "Próximamente"}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                    {c.type === "medical" ? "🩺 Médico" : "🎒 Mochilas"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openVolunteersModal(c)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg flex items-center gap-1.5 px-2" title="Ver Voluntarios">
                    <HeartHandshake className="h-3.5 w-3.5" /> <span className="text-xs font-semibold">Voluntarios</span>
                  </button>
                  <a href={`/donar/${c.slug || c.id}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg" title="Ver landing"><ExternalLink className="h-3.5 w-3.5" /></a>
                  <button onClick={() => openModal(c)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg"><Edit2 className="h-3.5 w-3.5" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>

              <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>

              {c.eventDate && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "short", year: "numeric" }).format(new Date(c.eventDate))}
                </div>
              )}

              <div className="mt-2">
                <code className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded font-mono">
                  /donar/{c.slug || c.id}
                </code>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Meta</p>
                  <p className="font-semibold">{c.goal} {c.unit}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Desde</p>
                  <p className="font-semibold text-primary">RD$ {c.pricePerUnit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-lg w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-5">{editingId ? "Editar campaña" : "Nueva campaña"}</h2>
            <form onSubmit={submit} className="space-y-4">

              {/* Type */}
              <div>
                <label className="text-xs font-semibold">Tipo de campaña</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {([["backpacks", "🎒 Mochilas"], ["medical", "🩺 Médico"]] as const).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setType(val);
                        if (val === "medical") { setUnit("pacientes"); setPricePerUnit(500); }
                        else { setUnit("mochilas"); setPricePerUnit(450); }
                      }}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm font-medium transition-all",
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
                <label className="text-xs font-semibold">Título</label>
                <input
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  required
                  placeholder="ej. 50 Mochilas para Las Charcas"
                  className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="text-xs font-semibold">URL de la campaña (slug)</label>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">/donar/</span>
                  <input
                    value={slug}
                    onChange={e => { setSlug(e.target.value); setSlugManual(true); }}
                    required
                    placeholder="nombre-de-campana"
                    className="flex-1 px-3 py-2 text-sm rounded-lg border bg-background font-mono"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Se genera automáticamente desde el título. Puedes editarlo.</p>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold">Descripción corta</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required className="w-full px-3 py-2 text-sm rounded-lg border mt-1 h-20 bg-background" />
              </div>

              {/* Goal + Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold">Meta (cantidad)</label>
                  <input type="number" value={goal} onChange={e => setGoal(Number(e.target.value))} required min={1} className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Unidad</label>
                  <input value={unit} onChange={e => setUnit(e.target.value)} required className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" placeholder="mochilas / pacientes" />
                </div>
              </div>

              {/* Price + Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold">Costo unitario desde (RD$)</label>
                  <input type="number" value={pricePerUnit} onChange={e => setPricePerUnit(Number(e.target.value))} required min={1} className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Estado</label>
                  <select value={status} onChange={e => setStatus(e.target.value as any)} className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background">
                    <option value="active">Activa</option>
                    <option value="upcoming">Próximamente</option>
                    <option value="completed">Completada</option>
                  </select>
                </div>
              </div>

              {/* Event Date */}
              <div>
                <label className="text-xs font-semibold">Fecha del evento / límite (opcional)</label>
                <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl flex justify-center items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Volunteers Modal */}
      {volunteersModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-2xl w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="text-xl font-bold text-foreground">Voluntarios</h2>
                <p className="text-sm text-muted-foreground">{selectedCampaign.title}</p>
              </div>
              <button onClick={closeVolunteersModal} className="text-sm font-semibold px-3 py-1.5 border rounded-lg hover:bg-secondary">
                Cerrar
              </button>
            </div>

            {appsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : applications.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl">
                <HeartHandshake className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">Nadie se ha postulado aún</p>
                <p className="text-xs text-muted-foreground">Los voluntarios verán esta campaña en su perfil.</p>
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {applications.map(app => (
                  <div key={app.id} className="border rounded-xl p-4 bg-background">
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <h4 className="font-bold text-sm flex items-center gap-2">
                          {app.volunteerName}
                          <span className={cn(
                            "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                            app.volunteerType === "local" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                          )}>
                            {app.volunteerType === "local" ? "Local" : "Digital"}
                          </span>
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">{app.city}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {app.status === "pending" && (
                          <>
                            <button onClick={() => updateApplicationStatus(app.id, "approved")} className="text-xs font-semibold px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg">Aprobar</button>
                            <button onClick={() => updateApplicationStatus(app.id, "rejected")} className="text-xs font-semibold px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg">Rechazar</button>
                          </>
                        )}
                        {app.status === "approved" && (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Asignar rol (ej. Logística)"
                              defaultValue={app.assignedRole}
                              onBlur={(e) => {
                                if (e.target.value !== app.assignedRole) updateApplicationStatus(app.id, "approved", e.target.value);
                              }}
                              className="text-xs px-2 py-1.5 border rounded-lg w-40 bg-background"
                            />
                            <button onClick={() => markMissionCompleted(app)} className="text-xs font-semibold px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Finalizar misión
                            </button>
                          </div>
                        )}
                        {app.status === "completed" && (
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                            Misión completada (+1)
                          </span>
                        )}
                        {app.status === "rejected" && (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">
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
    </div>
  );
}
