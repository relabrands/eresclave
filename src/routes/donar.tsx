import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ArrowRight, Loader2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/donar")({
  head: () => ({
    meta: [
      { title: "Campañas · Eres Clave" },
      { name: "description", content: "Apoya las campañas de Eres Clave para las comunidades de Las Charcas, Azua." },
      { property: "og:title", content: "Campañas · Eres Clave" },
      { property: "og:description", content: "Elige una campaña y marca la diferencia. Cada aporte cuenta." },
    ],
  }),
  component: DonarPage,
});

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  pricePerUnit: number;
  unit: string;
  status: "active" | "completed" | "upcoming";
}

function DonarPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, []);

  const active = campaigns.filter(c => c.status === "active");
  const upcoming = campaigns.filter(c => c.status === "upcoming");
  const completed = campaigns.filter(c => c.status === "completed");

  const statusStyle: Record<Campaign["status"], string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    upcoming: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-stone-500/10 text-stone-500 border-stone-400/20",
  };
  const statusLabel: Record<Campaign["status"], string> = {
    active: "Activa",
    upcoming: "Próximamente",
    completed: "Completada",
  };

  const CampaignCard = ({ c }: { c: Campaign }) => {
    const inner = (
      <div className={cn(
        "text-left w-full bg-card border rounded-2xl p-6 shadow-sm flex flex-col transition-all duration-200 group",
        c.status !== "upcoming"
          ? "hover:border-primary hover:shadow-md"
          : "opacity-60 cursor-not-allowed"
      )}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border",
            statusStyle[c.status]
          )}>
            {statusLabel[c.status]}
          </span>
          {c.status !== "upcoming" && (
            <span className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
          {c.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 flex-1">
          {c.description}
        </p>
        <div className="mt-5 pt-4 border-t border-border flex justify-between items-center">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Meta</p>
            <p className="text-sm font-semibold text-foreground mt-0.5">{c.goal} {c.unit}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Por {c.unit.replace(/s$/, "")}</p>
            <p className="text-sm font-bold text-primary mt-0.5">RD$ {c.pricePerUnit}</p>
          </div>
        </div>
      </div>
    );

    if (c.status === "upcoming") return <div key={c.id}>{inner}</div>;

    return (
      <Link
        key={c.id}
        to="/donar/$campaignId"
        params={{ campaignId: c.id }}
        className="block"
      >
        {inner}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <section className="bg-hero-gradient py-20 sm:py-28 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
          />
          <div className="container-tight relative text-center max-w-2xl mx-auto">
            <span className="inline-block bg-accent text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
              Iniciativa comunitaria · Las Charcas, Azua
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
              Eres Clave.<br />Tú decides el impacto.
            </h1>
            <p className="mt-5 text-white/75 text-lg leading-relaxed max-w-lg mx-auto">
              Elige una campaña y apadrina. Cada peso va directo a la comunidad — sin intermediarios.
            </p>
          </div>
        </section>

        {/* Campaigns */}
        <section className="container-tight py-16 sm:py-20 space-y-14">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-xl font-black text-foreground tracking-tight">Campañas activas</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {active.map(c => <CampaignCard key={c.id} c={c} />)}
                  </div>
                </div>
              )}

              {upcoming.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="inline-block w-2 h-2 rounded-full bg-blue-500" />
                    <h2 className="text-xl font-black text-foreground tracking-tight">Próximamente</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {upcoming.map(c => <CampaignCard key={c.id} c={c} />)}
                  </div>
                </div>
              )}

              {completed.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <span className="inline-block w-2 h-2 rounded-full bg-stone-400" />
                    <h2 className="text-xl font-black text-foreground tracking-tight">Campañas pasadas</h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {completed.map(c => <CampaignCard key={c.id} c={c} />)}
                  </div>
                </div>
              )}

              {campaigns.length === 0 && (
                <div className="text-center py-24">
                  <Heart className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-40" />
                  <h3 className="text-lg font-semibold text-foreground">No hay campañas disponibles aún</h3>
                  <p className="text-sm text-muted-foreground mt-2">Vuelve pronto — se vienen cosas bonitas.</p>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
