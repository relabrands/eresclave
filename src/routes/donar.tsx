import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Heart, X, CheckCircle2, Share2, ArrowRight,
  ShieldCheck, Copy, Phone, Camera, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import posterImg from "@/assets/apadrina_mochila_poster.png";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
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

interface Backpack {
  id: number;
  sponsored: boolean;
  donorName?: string;
  contactId?: string;
  message?: string;
}

const DEFAULT_PRICE = 450;
const DEFAULT_GOAL = 50;

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function DonarPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const q = query(collection(db, "campaigns"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
      setLoadingCampaigns(false);
    }, () => setLoadingCampaigns(false));
    return unsub;
  }, []);

  if (loadingCampaigns) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {selectedCampaign ? (
          <CampaignDetailView
            campaign={selectedCampaign}
            onBack={() => setSelectedCampaign(null)}
          />
        ) : (
          <CampaignsLanding
            campaigns={campaigns}
            onSelect={setSelectedCampaign}
          />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

/* ─── Campaigns Landing ─── */
function CampaignsLanding({
  campaigns,
  onSelect,
}: {
  campaigns: Campaign[];
  onSelect: (c: Campaign) => void;
}) {
  const active = campaigns.filter(c => c.status === "active");
  const upcoming = campaigns.filter(c => c.status === "upcoming");
  const completed = campaigns.filter(c => c.status === "completed");

  const statusLabel: Record<Campaign["status"], string> = {
    active: "Activa",
    upcoming: "Próximamente",
    completed: "Completada",
  };
  const statusStyle: Record<Campaign["status"], string> = {
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    upcoming: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    completed: "bg-stone-500/10 text-stone-500 border-stone-400/20",
  };

  const CampaignCard = ({ c }: { c: Campaign }) => (
    <button
      onClick={() => c.status !== "upcoming" ? onSelect(c) : undefined}
      disabled={c.status === "upcoming"}
      className={cn(
        "text-left w-full bg-card border rounded-2xl p-6 shadow-sm flex flex-col transition-all duration-200 group",
        c.status !== "upcoming"
          ? "hover:border-primary hover:shadow-md cursor-pointer"
          : "opacity-60 cursor-not-allowed"
      )}
    >
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
    </button>
  );

  return (
    <div>
      <section className="bg-hero-gradient py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
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

      <section className="container-tight py-16 sm:py-20 space-y-14">
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
      </section>
    </div>
  );
}

/* ─── Campaign Detail View ─── */
function CampaignDetailView({
  campaign,
  onBack,
}: {
  campaign: Campaign;
  onBack: () => void;
}) {
  const [backpacks, setBackpacks] = useState<Backpack[]>([]);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [selectedBackpack, setSelectedBackpack] = useState<Backpack | null>(null);
  const [loading, setLoading] = useState(true);

  const goal = campaign.goal ?? DEFAULT_GOAL;
  const price = campaign.pricePerUnit ?? DEFAULT_PRICE;

  useEffect(() => {
    const baseArray: Backpack[] = Array.from({ length: goal }, (_, i) => ({
      id: i + 1,
      sponsored: false,
    }));


    const q = query(collection(db, "donations"), where("campaignId", "==", campaign.id));
    const unsub = onSnapshot(q, (snap) => {
      const updated = [...baseArray];
      snap.docs.forEach(d => {
        const data = d.data();
        const unit = data.unitNumber;
        if (unit && unit <= goal) {
          updated[unit - 1] = {
            id: unit,
            sponsored: true,
            donorName: data.donorName,
            contactId: data.contactId,
            message: data.message,
          };
        }
      });
      setBackpacks(updated);
      setLoading(false);
    });
    return unsub;
  }, [campaign.id, goal]);

  const sponsored = backpacks.filter(b => b.sponsored).length;
  const pct = Math.min(Math.round((sponsored / goal) * 100), 100);
  const raised = sponsored * price;

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <>
      <div className="container-tight pt-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowRight className="h-4 w-4 rotate-180" /> Ver todas las campañas
        </button>
      </div>

      <HeroSection
        campaign={campaign}
        sponsored={sponsored}
        pct={pct}
        raised={raised}
        goal={goal}
        price={price}
        onDonate={() => setDonateModalOpen(true)}
      />
      <TreeSection
        backpacks={backpacks}
        goal={goal}
        price={price}
        onSelectBackpack={setSelectedBackpack}
        onDonate={() => setDonateModalOpen(true)}
      />
      <HowItWorksSection onDonate={() => setDonateModalOpen(true)} />
      <PhotoGallerySection />
      <TransparencySection price={price} goal={goal} />
      <CampaignFooter />

      {donateModalOpen && <DonationModal onClose={() => setDonateModalOpen(false)} />}
      {selectedBackpack && (
        <BackpackModal backpack={selectedBackpack} onClose={() => setSelectedBackpack(null)} />
      )}

      {/* Floating CTA — mobile only */}
      <div className="fixed bottom-5 right-5 z-40 md:hidden">
        <button
          onClick={() => setDonateModalOpen(true)}
          className="flex items-center gap-2 text-white font-semibold text-sm px-5 py-3 rounded-full shadow-xl transition-all duration-200 bg-accent hover:opacity-90 active:scale-95"
        >
          <Heart className="h-4 w-4" />
          Apadrinar
        </button>
      </div>
    </>
  );
}

/* ─── Hero ─── */
function HeroSection({
  campaign, sponsored, pct, raised, goal, price, onDonate
}: { campaign: Campaign; sponsored: number; pct: number; raised: number; goal: number; price: number; onDonate: () => void }) {
  const { ref, inView } = useInView();
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://eresclave-psi.vercel.app/donar";

  const handleShareProgress = async () => {
    const remaining = goal - sponsored;
    let text = "";
    if (pct >= 100) {
      text = `🎉 ¡Ya superamos la meta! La campaña 50 Mochilas para Las Charcas ya tiene ${sponsored} mochilas apadrinadas — y los donativos siguen llegando. ¡Gracias a quienes lo hicieron posible! 🎒

¿Tú también quieres aportar? Cada mochila abre una puerta.
${shareUrl}`;
    } else if (pct >= 50) {
      text = `💪 Llevamos ${sponsored} de ${goal} mochilas apadrinadas en la campaña de Las Charcas — ¡ya vamos más de la mitad! Solo faltan ${remaining} para llegar a la meta.

¿Nos ayudas a completarla? 🎒
${shareUrl}`;
    } else {
      text = `🎒 La campaña 50 Mochilas para Las Charcas está en marcha. Ya tenemos ${sponsored} mochilas apadrinadas y nos faltan ${remaining} para llegar a la meta. ¡Cada aportación cuenta!

Úneteles en: ${shareUrl}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: "50 Mochilas • Las Charcas", text, url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("¡Mensaje copiado! Pégalo donde quieras compartirlo.", { duration: 4000 });
    }
  };

  return (
    <section ref={ref} className="bg-hero-gradient relative overflow-hidden">
      {/* subtle texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />

      <div className="container-tight relative grid lg:grid-cols-[1fr_400px] gap-14 items-center py-20 sm:py-28">

        {/* Text */}
        <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          {/* Badge */}
          <span className="inline-block bg-accent text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            {campaign.status === "active" ? "Campaña activa" : campaign.status === "completed" ? "Campaña completada" : "Próximamente"} — Las Charcas, Azua
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
            {campaign.title}
          </h1>

          <p className="mt-5 text-white/75 text-lg leading-relaxed max-w-md font-normal">
            {campaign.description || <>Apadrina el año escolar de un niño por{" "}
            <span className="font-semibold text-white">RD$ {price}</span>.
            Tu nombre quedará en el árbol de esta campaña.</>}
          </p>

          {/* Progress */}
          <div className="mt-10 bg-white/10 border border-white/15 rounded-2xl p-5 max-w-md backdrop-blur-sm">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="text-sm font-medium text-white/80">
                {pct >= 100 ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> 
                    {pct === 100 ? "¡Meta alcanzada!" : "¡Meta superada!"} ({sponsored}/{goal})
                  </span>
                ) : (
                  `${sponsored} de ${goal} mochilas apadrinadas`
                )}
              </span>
              <span className="text-sm font-bold text-white">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-accent transition-all duration-1000"
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          <p className="mt-2 text-xs text-white/45">
            RD$ {raised.toLocaleString()} de RD$ {(goal * price).toLocaleString()} recaudados
          </p>
          {/* Share progress */}
          <button
            onClick={handleShareProgress}
            className="mt-4 inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-medium transition-colors group"
          >
            <Share2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
            Compartir progreso
          </button>
        </div>

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={onDonate}
              className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-7 py-3.5 rounded-full text-sm tracking-wide transition-all duration-200 shadow-warm"
            >
              <Heart className="h-4 w-4" />
              Apadrinar una mochila
            </button>
            <button
              onClick={() => document.getElementById("tree-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-medium px-6 py-3.5 rounded-full text-sm transition-all"
            >
              Ver el árbol <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Poster */}
        <div className={cn(
          "flex justify-center lg:justify-end transition-all duration-700 delay-150",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        )}>
          <img
            src={posterImg}
            alt="Afiche de la campaña 50 Mochilas para Las Charcas"
            className="w-full max-w-[340px] rounded-2xl shadow-2xl ring-1 ring-white/10"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── Tree Grid ─── */
function TreeSection({
  backpacks, goal, price, onSelectBackpack, onDonate
}: {
  backpacks: Backpack[];
  goal: number;
  price: number;
  onSelectBackpack: (b: Backpack) => void;
  onDonate: () => void;
}) {
  const { ref, inView } = useInView(0.05);
  const sponsored = backpacks.filter(b => b.sponsored).length;

  return (
    <section id="tree-section" className="bg-card py-16 sm:py-20 border-b border-border" ref={ref}>
      <div className="container-tight">

        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            El árbol de las mochilas
          </h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">
            Cada mochila apadrinada se ilumina con el nombre del donante.
            Las disponibles esperan a alguien como tú.
          </p>
          <div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm bg-primary ring-2 ring-primary/30" />
              Apadrinada ({sponsored})
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-sm border-2 border-dashed border-border" />
              Disponible ({goal - sponsored})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {backpacks.map((bp, i) => (
            <BackpackSlot
              key={bp.id}
              backpack={bp}
              delay={i * 18}
              visible={inView}
              onClick={() => bp.sponsored ? onSelectBackpack(bp) : onDonate()}
            />
          ))}
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button
            onClick={onDonate}
            className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-6 py-3 rounded-full text-sm transition-all duration-200"
          >
            <Heart className="h-4 w-4" />
            Apadrinar — RD$ {price}
          </button>
          <p className="text-xs text-muted-foreground">Tu nombre aparecerá aquí.</p>
        </div>
      </div>
    </section>
  );
}

function BackpackSlot({
  backpack, delay, visible, onClick
}: {
  backpack: Backpack; delay: number; visible: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={
        backpack.sponsored
          ? `Mochila #${backpack.id} — Apadrinada por ${backpack.donorName}`
          : `Mochila #${backpack.id} — RD$ 450 — Disponible`
      }
      className={cn(
        "relative aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-90",
        backpack.sponsored
          ? "bg-primary hover:opacity-90 hover:-translate-y-0.5 shadow-soft ring-1 ring-primary/40"
          : "bg-secondary border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/80",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {backpack.sponsored ? (
        <>
          <span className="text-xl leading-none">🎒</span>
          <span className="text-[8px] font-bold text-white/90 leading-tight mt-0.5 truncate w-full px-0.5">
            {backpack.donorName}
          </span>
          <span className="text-[7px] text-white/50">#{backpack.id}</span>
        </>
      ) : (
        <>
          <span className="text-base opacity-20">🎒</span>
          <span className="text-[8px] text-muted-foreground font-medium mt-0.5">#{backpack.id}</span>
        </>
      )}
    </button>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection({ onDonate }: { onDonate: () => void }) {
  const { ref, inView } = useInView();

  const steps = [
    { number: "01", title: "Transfiere RD$ 450", desc: "Elige cualquiera de nuestras cuentas bancarias y realiza la transferencia." },
    { number: "02", title: "Envía el comprobante", desc: "Manda una captura por WhatsApp al número de la campaña. Te respondemos de inmediato." },
    { number: "03", title: "Tu nombre en el árbol", desc: "Activamos tu mochila en el árbol y te enviamos foto de la entrega." },
  ];

  return (
    <section className="bg-secondary/40 border-b border-border py-16 sm:py-20" ref={ref}>
      <div className="container-tight">
        <div className="max-w-xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Cómo apadrinar
          </h2>
          <p className="mt-3 text-muted-foreground">Tres pasos. Menos de cinco minutos.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div
              key={i}
              className={cn(
                "transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="block text-4xl font-black text-primary/20 mb-4 tracking-tight">{s.number}</span>
              <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <button
            onClick={onDonate}
            className="inline-flex items-center gap-2 border border-border bg-card text-foreground hover:bg-secondary font-medium px-6 py-3 rounded-full text-sm transition-all"
          >
            Ver datos bancarios <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── Photo Gallery ─── */
function PhotoGallerySection() {
  const { ref, inView } = useInView();
  const slots = Array.from({ length: 6 });

  return (
    <section className="bg-card py-16 sm:py-20 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="max-w-xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Tu aporte, visible.
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed text-base">
            Cada mochila entregada será fotografiada y publicada aquí.
            Podrás ver exactamente adónde llegó tu contribución.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {slots.map((_, i) => (
            <div
              key={i}
              className={cn(
                "aspect-[4/3] rounded-2xl bg-secondary border border-border flex flex-col items-center justify-center gap-2 transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <Camera className="h-6 w-6 text-primary/30" />
              <span className="text-xs text-muted-foreground font-medium text-center px-4">
                Foto {i + 1} — próximamente
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 max-w-lg border-l-2 border-primary/30 pl-5">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Publicaremos fotos y videos de la entrega en esta página y en nuestras redes.
            Los donantes recibirán notificación directa.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Transparency ─── */
function TransparencySection({ price, goal }: { price: number; goal: number }) {
  const { ref, inView } = useInView();

  const kitItems = [
    "Mochila escolar",
    "Cuadernos",
    "Lápices y borrador",
    "Sacapuntas y regla",
    "Colores y crayolas",
    "Tijeras escolares",
    "Útiles adicionales",
  ];

  const guarantees = [
    { icon: <ShieldCheck className="h-4 w-4" />, text: "100% de los fondos van a útiles escolares" },
    { icon: <CheckCircle2 className="h-4 w-4" />, text: "Precios al por mayor para equipar más mochilas" },
    { icon: <Camera className="h-4 w-4" />, text: "Foto y video de cada mochila entregada" },
    { icon: <Heart className="h-4 w-4" />, text: "Puedes conocer al niño que apoyaste" },
  ];

  return (
    <section className="bg-secondary/40 py-16 sm:py-20 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="grid lg:grid-cols-2 gap-10 items-start">

          {/* Kit */}
          <div className={cn("transition-all duration-[600ms]", inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5")}>
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">
              Qué incluye cada mochila
            </h2>
            <p className="text-muted-foreground text-sm mb-8">
              RD$ {price} cubre un kit completo para comenzar el año escolar.
            </p>
            <ul className="space-y-0">
              {kitItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Por mochila completa</p>
                <p className="text-2xl font-black text-foreground">RD$ {price}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">Meta total</p>
                <p className="text-sm font-semibold text-foreground">RD$ {(price * goal).toLocaleString()} · {goal} mochilas</p>
              </div>
            </div>
          </div>

          {/* Guarantees */}
          <div className={cn("transition-all duration-[600ms] delay-100", inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5")}>
            <div className="bg-hero-gradient text-white rounded-2xl p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-6">
                Garantías de transparencia
              </p>
              <ul className="space-y-5">
                {guarantees.map((g, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="flex-shrink-0 text-white/50 mt-0.5">{g.icon}</span>
                    <span className="text-sm text-white/80 leading-relaxed">{g.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/15">
                <p className="text-xs text-white/40 leading-relaxed">
                  Esta campaña nace de la comunidad y rinde cuentas a la comunidad.
                  Cero intermediarios políticos. Cero desvíos.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Campaign Footer ─── */
function CampaignFooter() {
  const share = () => {
    const text = "Apadrina una mochila escolar para un niño de Las Charcas por RD$ 450. #EresClave";
    if (navigator.share) {
      navigator.share({ title: "50 Mochilas para Las Charcas", text, url: window.location.href });
    } else {
      navigator.clipboard.writeText(`${text} ${window.location.href}`);
      toast.success("Enlace copiado");
    }
  };

  return (
    <section className="bg-hero-gradient py-14 sm:py-16">
      <div className="container-tight flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">
            Iniciativa comunitaria
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight max-w-sm leading-tight">
            Comparte y lleguemos a 50.
          </h2>
          <p className="mt-2 text-white/55 text-sm max-w-xs leading-relaxed">
            Cero política. 100% impacto. Las Charcas, Azua.
          </p>
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          <button
            onClick={share}
            className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-6 py-3 rounded-full text-sm active:scale-95 transition-all"
          >
            <Share2 className="h-4 w-4" /> Compartir campaña
          </button>
          <a
            href="https://wa.me/18297404861?text=Hola%2C%20quiero%20apadrinar%20una%20mochila%20para%20Las%20Charcas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 border border-white/25 text-white/75 hover:text-white hover:border-white/50 font-medium px-6 py-3 rounded-full text-sm transition-all"
          >
            <Phone className="h-4 w-4" /> Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─── Donation Modal ─── */
function DonationModal({ onClose }: { onClose: () => void }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Número copiado");
  };

  const banks = [
    { name: "Banco Popular Dominicano", account: "808368880", holder: "Robinson Sánchez" },
    { name: "BHD León", account: "26817390011", holder: "Robinson Sánchez" },
    { name: "Banreservas", account: "9607080353", holder: "Robinson Sánchez" },
  ];

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
      onClick={onBackdrop}
    >
      <div
        className="bg-card w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        {/* Handle — mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <span className="w-10 h-1 rounded-full bg-border block" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Apadrinar una mochila</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Transferencia bancaria — RD$ 450</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Amount */}
          <div className="rounded-xl bg-secondary border border-border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Monto</p>
            <p className="text-4xl font-black text-foreground tracking-tight">RD$ 450</p>
            <p className="text-xs text-muted-foreground mt-1">por mochila escolar completa</p>
          </div>

          {/* Banks */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Cuentas bancarias
            </p>
            <div className="space-y-2">
              {banks.map((bank, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-foreground">{bank.name}</p>
                    <p className="text-sm font-mono text-foreground mt-0.5">{bank.account}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{bank.holder}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(bank.account)}
                    className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-primary transition-colors ml-3 border border-border"
                    title="Copiar número de cuenta"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Steps */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Pasos</p>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-black text-primary/40 w-4 shrink-0 leading-relaxed">1</span>
                <span>Transfiere RD$ 450 a cualquiera de las cuentas</span>
              </li>
              <li className="flex gap-3">
                <span className="font-black text-primary/40 w-4 shrink-0 leading-relaxed">2</span>
                <span>Envía el comprobante por WhatsApp</span>
              </li>
              <li className="flex gap-3">
                <span className="font-black text-primary/40 w-4 shrink-0 leading-relaxed">3</span>
                <span>Tu nombre aparece en el árbol de mochilas</span>
              </li>
            </ol>
          </div>

          {/* WhatsApp */}
          <a
            href="https://wa.me/18297404861?text=Hola%2C%20acabo%20de%20transferir%20para%20apadrinar%20una%20mochila.%20Te%20env%C3%ADo%20el%20comprobante."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full bg-accent hover:opacity-90 text-white rounded-xl px-5 py-4 transition-all"
          >
            <div>
              <p className="text-sm font-semibold">Enviar comprobante por WhatsApp</p>
              <p className="text-xs text-white/65 mt-0.5">(829) 740-4861</p>
            </div>
            <ArrowRight className="h-4 w-4 text-white/60 flex-shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Backpack Detail Modal ─── */
function BackpackModal({ backpack, onClose }: { backpack: Backpack; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50"
      onClick={onBackdrop}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="bg-card rounded-2xl max-w-sm w-full shadow-card overflow-hidden border border-border">
        <div className="bg-hero-gradient px-6 py-8 text-center">
          <span className="text-4xl">🎒</span>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/60">
            Mochila #{backpack.id} — Apadrinada
          </p>
        </div>
        <div className="px-6 py-6">
          <h3 className="text-xl font-black text-foreground tracking-tight">{backpack.donorName}</h3>
          <p className="text-xs text-muted-foreground mt-1">Donante de esta mochila</p>

          {backpack.message && (
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4 italic">
              {backpack.message}
            </p>
          )}

          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
            Esta mochila llegará a un niño de Las Charcas, Azua, gracias a{" "}
            <strong className="text-foreground font-semibold">{backpack.donorName}</strong>.
          </p>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                const msgs = [
                  `Acabo de apadrinar la mochila #${backpack.id} para los niños de Las Charcas. ¡Únete a Eres Clave y apoya la educación! 🎒✨ https://eresclave.org/donar`,
                  `¡Ya puse mi granito de arena! Apadriné la mochila #${backpack.id} para la juventud de Las Charcas. Hazlo tú también: https://eresclave.org/donar 🚀`,
                  `La educación cambia vidas. Acabo de apadrinar la mochila #${backpack.id} en Eres Clave. ¡Súmate a esta iniciativa! ❤️ https://eresclave.org/donar`
                ];
                const text = msgs[Math.floor(Math.random() * msgs.length)];
                if (navigator.share) {
                  navigator.share({
                    title: "Eres Clave - Las Charcas",
                    text: text
                  }).catch(() => {
                    navigator.clipboard.writeText(text);
                    toast.success("Mensaje copiado al portapapeles");
                  });
                } else {
                  navigator.clipboard.writeText(text);
                  toast.success("Mensaje copiado al portapapeles");
                }
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all shadow-glow"
            >
              <Share2 className="h-4 w-4" />
              Compartir mi donación
            </button>
            <button
              onClick={onClose}
              className="w-full border border-border text-muted-foreground font-medium py-3 rounded-xl text-sm hover:bg-secondary transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
