import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  TrendingUp, Users, Target, HeartHandshake,
  ArrowUpRight, Plus, ExternalLink, Calendar,
  Award, CheckCircle2, MapPin, HandCoins,
  DollarSign, Sparkles, ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardOverview,
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
  type?: "backpacks" | "medical";
  eventDate?: string;
}

interface Donation {
  id: string;
  campaignId: string;
  donorName?: string;
  amount: number;
  unitNumber: number;
  isPaid?: boolean;
  createdAt?: any;
}

interface Volunteer {
  id: string;
  name: string;
  email: string;
  type: "local" | "digital";
  city: string;
  volunteerId: string;
  joinedAt: any;
  active?: boolean;
  missions?: string[];
}

function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [contactsCount, setContactsCount] = useState(0);

  useEffect(() => {
    // Realtime listeners for live updates
    const unsubCamps = onSnapshot(collection(db, "campaigns"), (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
    });

    const unsubDonations = onSnapshot(collection(db, "donations"), (snap) => {
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
    });

    const unsubVolunteers = onSnapshot(collection(db, "volunteers"), (snap) => {
      setVolunteers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Volunteer)));
    });

    const unsubContacts = onSnapshot(collection(db, "contacts"), (snap) => {
      setContactsCount(snap.size);
      setLoading(false);
    }, () => setLoading(false));

    return () => {
      unsubCamps();
      unsubDonations();
      unsubVolunteers();
      unsubContacts();
    };
  }, []);

  // Metrics calculations
  const totalRaised = donations.reduce((acc, d) => acc + (Number(d.amount) || 0), 0);
  const totalDonations = donations.length;
  const paidDonations = donations.filter(d => d.isPaid).length;
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;
  const activeVolunteers = volunteers.filter(v => v.active !== false).length;
  const totalMissionsDone = volunteers.reduce((acc, v) => acc + (v.missions?.length || 0), 0);

  const formatRD = (val: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      maximumFractionDigits: 0,
    }).format(val).replace("DOP", "RD$");
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return "—";
    const d = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("es-DO", { day: "2-digit", month: "short" });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="h-9 w-9 animate-spin text-primary mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Cargando métricas de la fundación…</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ─── HERO BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#004A45] via-[#006E66] to-[#00897B] text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white/90">
              <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
              Panel de Control · Fundación Eres Clave
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Resumen General de Impacto
            </h1>
            <p className="text-sm text-white/80 max-w-xl leading-relaxed">
              Métricas consolidadas de recaudación, apadrinamientos, escuadrón de voluntarios y campañas activas en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/dashboard/campanas"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-[#006E66] font-bold text-xs shadow-md hover:bg-white/90 transition-all active:scale-98"
            >
              <Plus className="h-4 w-4" />
              Nueva Campaña
            </Link>
            <Link
              to="/dashboard/voluntarios"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all active:scale-98"
            >
              <HeartHandshake className="h-4 w-4 text-[#F59E0B]" />
              Ver Escuadrón
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 6 KPI METRICS GRID ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recaudación */}
        <div className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Monto Recaudado</span>
            <div className="h-9 w-9 rounded-2xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{formatRD(totalRaised)}</p>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-medium">
            <span className="text-emerald-600 font-bold">{paidDonations} pagados</span>
            <span>•</span>
            <span>{totalDonations - paidDonations} en proceso</span>
          </div>
        </div>

        {/* Apadrinamientos / Donaciones */}
        <div className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Apadrinamientos</span>
            <div className="h-9 w-9 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <HandCoins className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{totalDonations}</p>
          <p className="text-xs text-muted-foreground mt-2">Aportes individuales registrados</p>
        </div>

        {/* Campañas Activas */}
        <div className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Campañas Activas</span>
            <div className="h-9 w-9 rounded-2xl bg-blue-500/10 text-blue-600 grid place-items-center">
              <Target className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{activeCampaigns}</p>
          <p className="text-xs text-muted-foreground mt-2">De {campaigns.length} campañas creadas</p>
        </div>

        {/* Voluntarios */}
        <div className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Voluntarios</span>
            <div className="h-9 w-9 rounded-2xl bg-amber-500/10 text-amber-600 grid place-items-center">
              <HeartHandshake className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{volunteers.length}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{activeVolunteers} activos en el escuadrón</span>
          </div>
        </div>

        {/* Misiones Completadas */}
        <div className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Misiones Realizadas</span>
            <div className="h-9 w-9 rounded-2xl bg-purple-500/10 text-purple-600 grid place-items-center">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{totalMissionsDone}</p>
          <p className="text-xs text-muted-foreground mt-2">Participaciones validadas</p>
        </div>

        {/* Contactos */}
        <div className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Directorio Contactos</span>
            <div className="h-9 w-9 rounded-2xl bg-teal-500/10 text-teal-600 grid place-items-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground">{contactsCount}</p>
          <p className="text-xs text-muted-foreground mt-2">Personas conectadas con la fundación</p>
        </div>
      </div>

      {/* ─── CAMPAÑAS ACTIVAS (BARRA DE PROGRESO EN VIVO) ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-foreground">Progreso de Campañas</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Avance de recaudación por iniciativa activa</p>
          </div>
          <Link
            to="/dashboard/campanas"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            Ver todas ({campaigns.length})
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {campaigns.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border p-8 text-center text-muted-foreground">
            <Target className="h-8 w-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No hay campañas registradas.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {campaigns.map((camp) => {
              const campDonations = donations.filter(d => d.campaignId === camp.id);
              const campRaised = campDonations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
              const unitsCount = campDonations.length;
              const percent = Math.min(100, Math.round((unitsCount / (camp.goal || 1)) * 100));

              return (
                <div
                  key={camp.id}
                  className="bg-card rounded-3xl p-5 border border-border/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full",
                          camp.status === "active" ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20" :
                          camp.status === "completed" ? "bg-stone-500/10 text-stone-700 border border-stone-500/20" : "bg-blue-500/10 text-blue-700 border border-blue-500/20"
                        )}>
                          {camp.status === "active" ? "Activa" : camp.status === "completed" ? "Completada" : "Próxima"}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {camp.type === "medical" ? "🩺 Médico" : "🎒 Mochilas"}
                        </span>
                      </div>

                      <a
                        href={`/donar/${camp.slug || camp.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-7 w-7 rounded-lg bg-secondary hover:bg-primary/10 hover:text-primary flex items-center justify-center text-muted-foreground transition-colors"
                        title="Ver landing pública"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>

                    <h3 className="font-bold text-foreground text-base mb-1">{camp.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                      {camp.description}
                    </p>
                  </div>

                  {/* Progress Bar & Numbers */}
                  <div className="space-y-2 pt-3 border-t border-border/60">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-foreground">
                        {unitsCount} de {camp.goal} {camp.unit}
                      </span>
                      <span className="text-primary font-black">{percent}%</span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#006E66] to-[#00897B] transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                      <span>Recaudado: <strong className="text-foreground">{formatRD(campRaised)}</strong></span>
                      <span>Meta: <strong className="text-foreground">{camp.goal} {camp.unit}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── 2-COLUMN ACTIVITY: ÚLTIMAS DONACIONES & VOLUNTARIOS ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recientes Donaciones */}
        <div className="bg-card rounded-3xl p-6 border border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-600 grid place-items-center">
                <HandCoins className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Últimos Apadrinamientos</h3>
                <p className="text-[11px] text-muted-foreground">Donaciones registradas en el sistema</p>
              </div>
            </div>
            <Link to="/dashboard/donaciones" className="text-xs font-bold text-primary hover:underline">
              Ver todas
            </Link>
          </div>

          {donations.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No hay donaciones registradas aún.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {donations.slice(0, 5).map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-xs text-foreground truncate">
                      {d.donorName || "Padrino Anónimo"}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span>Mochila #{d.unitNumber}</span>
                      <span>•</span>
                      <span>{formatDate(d.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-xs text-foreground">{formatRD(d.amount)}</p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5",
                      d.isPaid ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
                    )}>
                      {d.isPaid ? "Pagado" : "Pendiente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nuevos Voluntarios */}
        <div className="bg-card rounded-3xl p-6 border border-border/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">Escuadrón Reciente</h3>
                <p className="text-[11px] text-muted-foreground">Últimos voluntarios que se unieron</p>
              </div>
            </div>
            <Link to="/dashboard/voluntarios" className="text-xs font-bold text-primary hover:underline">
              Ver escuadrón
            </Link>
          </div>

          {volunteers.length === 0 ? (
            <div className="text-center py-10 text-xs text-muted-foreground">
              No hay voluntarios registrados aún.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {volunteers.slice(0, 5).map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-[#006E66] to-[#004A45] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                      {v.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-foreground truncate">{v.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{v.city || "Las Charcas"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block",
                      v.type === "local" ? "bg-amber-500/10 text-amber-700" : "bg-blue-500/10 text-blue-700"
                    )}>
                      {v.type === "local" ? "🏘️ Local" : "💻 Digital"}
                    </span>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{v.volunteerId || "#EC-000"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
