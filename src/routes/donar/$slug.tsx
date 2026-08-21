import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Heart, X, CheckCircle2, Share2, ArrowRight,
  ShieldCheck, Copy, Phone, Camera, Loader2,
  Stethoscope, Baby, Pill, Users, Calendar,
  ChevronDown, ChevronUp, Clock, ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import posterImg from "@/assets/apadrina_mochila_poster.png";
import { collection, query, where, onSnapshot, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/donar/$slug")({
  component: CampaignDetailPage,
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
  type?: "backpacks" | "medical" | string;
  eventDate?: string;
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

interface CampaignUpdate {
  id: string;
  date: string;
  title: string;
  body: string;
  imageUrl?: string;
}

interface Donor {
  id: string;
  donorName: string;
  amount: number;
  units: number;
  createdAt: any;
}

function CampaignDetailPage() {
  const { slug } = Route.useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [backpacks, setBackpacks] = useState<Backpack[]>([]);
  const [donateModalOpen, setDonateModalOpen] = useState(false);
  const [selectedBackpack, setSelectedBackpack] = useState<Backpack | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<"campana" | "actualizaciones" | "faq">("campana");
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [recentDonors, setRecentDonors] = useState<Donor[]>([]);

  // Fetch campaign by slug field
  useEffect(() => {
    const q = query(collection(db, "campaigns"), where("slug", "==", slug), limit(1));
    getDocs(q).then(snap => {
      if (snap.empty) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const d = snap.docs[0];
      setCampaign({ id: d.id, ...d.data() } as Campaign);
    }).catch(() => {
      setNotFound(true);
      setLoading(false);
    });
  }, [slug]);

  // Fetch donations only for backpack-type campaigns
  useEffect(() => {
    if (!campaign || campaign.type === "medical") {
      if (campaign) setLoading(false);
      return;
    }

    const goal = campaign.goal ?? DEFAULT_GOAL;
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
  }, [campaign]);

  // Fetch campaign updates and recent donors when campaign is loaded
  useEffect(() => {
    if (!campaign) return;
    // Fetch updates from subcollection
    const updatesQ = query(
      collection(db, "campaigns", campaign.id, "updates"),
      orderBy("date", "desc")
    );
    const unsubUpdates = onSnapshot(updatesQ, snap => {
      setUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() } as CampaignUpdate)));
    }, () => {});

    // Fetch recent donors (sort in memory to avoid requiring a composite index)
    const donorsQ = query(
      collection(db, "donations"),
      where("campaignId", "==", campaign.id)
    );
    const unsubDonors = onSnapshot(donorsQ, snap => {
      const rawDonors = snap.docs.map(d => ({
        id: d.id,
        donorName: d.data().donorName ?? "Anónimo",
        amount: d.data().amount ?? 0,
        createdAt: d.data().createdAt,
      }));

      const grouped = new Map<string, Donor>();
      rawDonors.forEach(d => {
        const timeKey = d.createdAt?.toMillis?.() ?? 0;
        const roundedTime = Math.floor(timeKey / 60000); // group within the same minute
        const key = `${d.donorName}-${roundedTime}`;
        
        if (grouped.has(key)) {
          const existing = grouped.get(key)!;
          existing.amount += d.amount;
          existing.units += 1;
        } else {
          grouped.set(key, {
            id: d.id,
            donorName: d.donorName,
            amount: d.amount,
            units: 1,
            createdAt: d.createdAt
          });
        }
      });

      const donors = Array.from(grouped.values());
      
      // Sort by createdAt descending
      donors.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() ?? 0;
        const timeB = b.createdAt?.toMillis?.() ?? 0;
        return timeB - timeA;
      });

      setRecentDonors(donors.slice(0, 10));
    }, () => {});

    return () => { unsubUpdates(); unsubDonors(); };
  }, [campaign]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !campaign) {
    return (
      <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <SiteHeader />
        <main className="flex-1 flex flex-col items-center justify-center text-center gap-4 px-4">
          <span className="text-5xl">🎒</span>
          <h1 className="text-2xl font-black text-foreground">Campaña no encontrada</h1>
          <p className="text-muted-foreground text-sm">Esta campaña no existe o fue eliminada.</p>
          <a href="/donar" className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-full text-sm hover:opacity-90 transition-all mt-2">
            Ver todas las campañas
          </a>
        </main>
        <SiteFooter />
      </div>
    );
  }

  // Default: backpacks template
  const goal = campaign.goal ?? DEFAULT_GOAL;
  const price = campaign.pricePerUnit ?? DEFAULT_PRICE;
  const sponsored = backpacks.filter(b => b.sponsored).length;
  const pct = Math.min(Math.round((sponsored / goal) * 100), 100);
  const raised = sponsored * price;

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-36 md:pb-24">
        <HeroSection
          campaign={campaign}
          sponsored={sponsored}
          pct={pct}
          raised={raised}
          goal={goal}
          price={price}
          onDonate={() => setDonateModalOpen(true)}
        />

        {/* Sticky Tabs */}
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="container-tight">
            <div className="flex items-center gap-0 overflow-x-auto">
              {([
                { id: "campana", label: "Campaña" },
                { id: "actualizaciones", label: `Actualizaciones${updates.length > 0 ? ` 🔴` : ""}` },
                { id: "faq", label: "FAQ" },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "shrink-0 px-5 py-4 text-sm font-semibold border-b-2 transition-all",
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab: Campaña */}
        {activeTab === "campana" && (
          <>
            {campaign.type === "medical" ? (
              <>
                <MedicalPackagesSection onDonate={() => setDonateModalOpen(true)} campaign={campaign} />
                <MedicalServicesSection />
                <MedicalTransparencySection onDonate={() => setDonateModalOpen(true)} campaign={campaign} />
              </>
            ) : (
              <>
                <TreeSection
                  backpacks={backpacks}
                  goal={goal}
                  price={price}
                  onSelectBackpack={setSelectedBackpack}
                  onDonate={() => setDonateModalOpen(true)}
                  campaign={campaign}
                />
                <HowItWorksSection onDonate={() => setDonateModalOpen(true)} />
                <PhotoGallerySection />
                <TransparencySection price={price} goal={goal} />
              </>
            )}
            <LiveDonorsSection donors={recentDonors} price={price} onDonate={() => setDonateModalOpen(true)} campaign={campaign} />
            <CampaignFooter />
          </>
        )}

        {/* Tab: Actualizaciones */}
        {activeTab === "actualizaciones" && (
          <UpdatesTimelineSection updates={updates} />
        )}

        {/* Tab: FAQ */}
        {activeTab === "faq" && (
          <FaqSection />
        )}
      </main>
      <SiteFooter />

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
        <div className="container-tight py-3 flex items-center justify-between gap-4">
          {campaign.status === "completed" ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-foreground">Campaña concluida con éxito</p>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">Esta iniciativa ya no recibe aportes. ¡Gracias a todos los donantes!</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-secondary border border-border px-3.5 py-2 rounded-xl shrink-0">
                Donaciones cerradas
              </span>
            </>
          ) : campaign.status === "upcoming" ? (
            <>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-600 shrink-0">
                  <Calendar className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-foreground">Próximamente disponible</p>
                  <p className="text-[11px] text-muted-foreground hidden sm:block">Esta campaña iniciará pronto.</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-secondary border border-border px-3.5 py-2 rounded-xl shrink-0">
                Próximamente
              </span>
            </>
          ) : (
            <>
              <div className="hidden sm:block">
                <p className="text-xs text-muted-foreground">Quedan <span className="font-bold text-foreground">{Math.max(0, goal - sponsored)}</span> de {goal} {campaign.unit || "unidades"} disponibles</p>
              </div>
              <button
                onClick={() => setDonateModalOpen(true)}
                className="flex-1 sm:flex-none sm:ml-auto inline-flex items-center justify-center gap-2 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-warm transition-all duration-200 bg-accent hover:opacity-90 active:scale-[0.98]"
              >
                <Heart className="h-4 w-4" />
                Apadrinar {campaign.unit ? campaign.unit.slice(0, -1) : "unidad"} · RD$ {price}
              </button>
            </>
          )}
        </div>
      </div>

      {donateModalOpen && (
        campaign.type === "medical"
          ? <MedicalDonationModal onClose={() => setDonateModalOpen(false)} />
          : <DonationModal campaign={campaign} onClose={() => setDonateModalOpen(false)} />
      )}
      {selectedBackpack && (
        <BackpackModal backpack={selectedBackpack} onClose={() => setSelectedBackpack(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MEDICAL CAMPAIGN SECTIONS
═══════════════════════════════════════════════ */
function MedicalPackagesSection({ onDonate, campaign }: { onDonate: () => void; campaign: Campaign }) {
  const isCompleted = campaign.status === "completed";
  const { ref: packagesRef, inView: packagesInView } = useInView(0.05);
  const packages = [
    { emoji: "🩺", title: "Apadrina 1 Paciente", price: 500, impact: "Cubre consulta médica + tratamiento básico de medicamentos para una persona.", color: "border-primary/40 hover:border-primary", badge: "Más popular" },
    { emoji: "👶", title: "Kit Pediátrico", price: 750, impact: "Vitaminas, desparasitantes y antibióticos para un niño. Salud infantil garantizada.", color: "border-emerald-400/40 hover:border-emerald-500", badge: "" },
    { emoji: "👵", title: "Kit Adulto Mayor", price: 1000, impact: "Medicamentos para control de presión arterial, diabetes y analgésicos de calidad.", color: "border-amber-400/40 hover:border-amber-500", badge: "Mayor impacto" },
    { emoji: "📦", title: "Aporte Libre / Insumos", price: 0, impact: "Fondo general para transporte de médicos, logística e hidratación del equipo.", color: "border-border hover:border-muted-foreground", badge: "" },
  ];

  return (
    <section ref={packagesRef} className="bg-card py-16 sm:py-20 border-b border-border">
      <div className="container-tight">
        <div className="max-w-xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Elige tu aporte</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">Cada nivel tiene un impacto concreto. Sabes exactamente a quién ayudas.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {packages.map((pkg, i) => (
            <div
              key={i}
              className={cn(
                "relative bg-card border-2 rounded-2xl p-6 flex flex-col transition-all duration-300",
                pkg.color,
                !isCompleted && "cursor-pointer",
                packagesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
              onClick={() => {
                if (isCompleted) {
                  toast("Esta campaña ya concluyó y no recibe nuevas donaciones.");
                  return;
                }
                if (pkg.price > 0) onDonate();
                else window.open("https://wa.me/18297404861?text=Quiero%20hacer%20un%20aporte%20libre%20para%20el%20operativo%20m%C3%A9dico", "_blank");
              }}
            >
              {pkg.badge && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full whitespace-nowrap">{pkg.badge}</span>}
              <div className="text-3xl mb-4">{pkg.emoji}</div>
              <h3 className="text-base font-bold text-foreground mb-1">{pkg.title}</h3>
              <div className="text-2xl font-black text-primary mb-3">{pkg.price > 0 ? `RD$ ${pkg.price}` : "Monto abierto"}</div>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{pkg.impact}</p>
              {isCompleted ? (
                <div className="mt-5 w-full bg-secondary text-muted-foreground font-semibold text-xs py-2.5 rounded-xl text-center border border-border">
                  Campaña concluida
                </div>
              ) : (
                <button className="mt-5 w-full bg-primary/10 text-primary font-semibold text-sm py-2.5 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all">
                  {pkg.price > 0 ? "Apadrinar" : "Coordinar aporte"}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MedicalServicesSection() {
  const { ref: servicesRef, inView: servicesInView } = useInView(0.1);
  const services = [
    { icon: <Stethoscope className="h-6 w-6" />, title: "Medicina General", desc: "Chequeo preventivo y diagnóstico para toda la comunidad.", color: "bg-blue-500/10 text-blue-600" },
    { icon: <Baby className="h-6 w-6" />, title: "Pediatría", desc: "Control de crecimiento, desparasitación y vitaminas para niños.", color: "bg-emerald-500/10 text-emerald-600" },
    { icon: <Pill className="h-6 w-6" />, title: "Farmacia Gratuita", desc: "Entrega inmediata del tratamiento recetado sin costo para el paciente.", color: "bg-purple-500/10 text-purple-600" },
    { icon: <Users className="h-6 w-6" />, title: "Atención al Adulto Mayor", desc: "Toma de presión, glucosa y entrega de medicamentos de uso continuo.", color: "bg-amber-500/10 text-amber-600" },
  ];

  return (
    <section ref={servicesRef} className="bg-background py-16 sm:py-20 border-b border-border">
      <div className="container-tight">
        <div className="max-w-xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Especialidades del operativo</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">Más de 150 familias de Las Charcas tendrán acceso a servicios médicos de calidad — sin costo.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((s, i) => (
            <div key={i} className={cn("bg-card rounded-2xl border p-6 transition-all duration-500", servicesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className={cn("inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4", s.color)}>{s.icon}</div>
              <h3 className="text-sm font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MedicalTransparencySection({ onDonate, campaign }: { onDonate: () => void; campaign: Campaign }) {
  const isCompleted = campaign.status === "completed";
  const { ref: transparencyRef, inView: transparencyInView } = useInView(0.1);
  const guarantees = [
    { icon: <Stethoscope className="h-4 w-4" />, text: "Médicos certificados: Profesionales colegiados atendiendo a la comunidad." },
    { icon: <ShieldCheck className="h-4 w-4" />, text: "Medicamentos sellados y vigentes: Fármacos de calidad garantizada." },
    { icon: <Camera className="h-4 w-4" />, text: "Reporte de impacto: Fotos, videos y desglose de pacientes atendidos al finalizar." },
    { icon: <Heart className="h-4 w-4" />, text: "100% transparente: Cada peso se convierte en salud real para Las Charcas." },
  ];

  return (
    <>
      <section className="bg-secondary/40 py-16 sm:py-20 border-b border-border">
        <div className="container-tight">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground mb-3">¿Cómo participar?</h2>
              <p className="text-muted-foreground mb-8">Dos formas de aportar. Cualquiera suma.</p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Heart className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">Aporte económico</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">Transfiere desde RD$ 500 y cubre la consulta médica + medicamentos de un paciente. Te enviamos reporte fotográfico del impacto.</p>
                    {!isCompleted && (
                      <button onClick={onDonate} className="mt-3 inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full hover:opacity-90 transition-all">Ver cuentas bancarias <ArrowRight className="h-3 w-3" /></button>
                    )}
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600"><Stethoscope className="h-5 w-5" /></div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1">Voluntariado médico / Fármacos</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">¿Eres médico, enfermero o farmacéutico? ¿Tienes medicamentos para donar? Coordínalo directamente por WhatsApp.</p>
                    <a href="https://wa.me/18297404861?text=Hola%2C%20quiero%20ser%20voluntario%20o%20donar%20f%C3%A1rmacos%20para%20el%20operativo%20m%C3%A9dico" target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full hover:bg-emerald-500/20 transition-all"><Phone className="h-3 w-3" /> Escribir por WhatsApp</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { value: "+150", label: "Familias beneficiadas", emoji: "🏘️" },
                { value: "4", label: "Especialidades médicas", emoji: "🩺" },
                { value: "100%", label: "Sin costo al paciente", emoji: "🆓" },
                { value: "1 día", label: "Jornada intensiva", emoji: "📅" },
              ].map((stat, i) => (
                <div key={i} className="bg-card rounded-2xl border p-5 text-center">
                  <div className="text-2xl mb-2">{stat.emoji}</div>
                  <div className="text-2xl font-black text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section ref={transparencyRef} className="bg-hero-gradient py-14 sm:py-20">
        <div className="container-tight">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Garantías de transparencia</h2>
            <p className="mt-3 text-white/65 text-base">Cada peso que aportas tiene nombre, destino y evidencia.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-4xl mx-auto">
            {guarantees.map((g, i) => (
              <div key={i} className={cn("bg-white/10 border border-white/20 rounded-2xl p-6 backdrop-blur-sm transition-all duration-500", transparencyInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")} style={{ transitionDelay: `${i * 80}ms` }}>
                <div className="text-white/50 mb-3">{g.icon}</div>
                <p className="text-sm text-white/80 leading-relaxed">{g.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center flex flex-col sm:flex-row items-center justify-center gap-4">
            {isCompleted ? (
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white/90 font-semibold px-8 py-3.5 rounded-full text-sm backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Operativo concluido con éxito
              </div>
            ) : (
              <button onClick={onDonate} className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-8 py-3.5 rounded-full text-sm active:scale-95 transition-all shadow-warm"><Heart className="h-4 w-4" /> Apadrinar un Paciente — RD$ 500</button>
            )}
            <a href="https://wa.me/18297404861?text=Hola%2C%20quiero%20ser%20m%C3%A9dico%20voluntario%20o%20donar%20f%C3%A1rmacos%20para%20el%20operativo%20m%C3%A9dico%20de%20Las%20Charcas" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/30 text-white/80 hover:text-white hover:border-white/60 font-medium px-7 py-3.5 rounded-full text-sm transition-all"><Phone className="h-4 w-4" /> Ser Médico Voluntario / Donar Fármacos</a>
          </div>
        </div>
      </section>
    </>
  );
}

function MedicalDonationModal({ onClose }: { onClose: () => void }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Número copiado");
  };

  const banks = [
    { name: "Banco Popular Dominicano", account: "808368880", holder: "Robinson Sánchez" },
    { name: "BHD León", account: "26817390011", holder: "Robinson Sánchez" },
    { name: "Banreservas", account: "9607080353", holder: "Robinson Sánchez" },
  ];

  const tiers = [
    { label: "1 Paciente", amount: "RD$ 500" },
    { label: "Kit Pediátrico", amount: "RD$ 750" },
    { label: "Kit Adulto Mayor", amount: "RD$ 1,000" },
  ];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onBackdrop}>
      <div className="bg-card w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <span className="w-10 h-1 rounded-full bg-border block" />
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">Apadrinar un Paciente</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Operativo Médico · Las Charcas</p>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Tiers */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Nivel de aporte</p>
            <div className="space-y-2">
              {tiers.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-secondary border border-border">
                  <span className="text-sm font-medium text-foreground">{t.label}</span>
                  <span className="text-sm font-bold text-primary">{t.amount}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Banks */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Cuentas bancarias</p>
            <div className="space-y-2">
              {banks.map((bank, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors">
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

          {/* WhatsApp */}
          <a
            href="https://wa.me/18297404861?text=Hola%2C%20acabo%20de%20transferir%20para%20apadrinar%20un%20paciente%20en%20el%20Operativo%20M%C3%A9dico%20de%20Las%20Charcas.%20Te%20env%C3%ADo%20el%20comprobante."
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


/* ═══════════════════════════════════════════════
   BACKPACKS CAMPAIGN TEMPLATE (original)
═══════════════════════════════════════════════ */
function HeroSection({
  campaign, sponsored, pct, raised, goal, price, onDonate
}: { campaign: Campaign; sponsored: number; pct: number; raised: number; goal: number; price: number; onDonate: () => void }) {
  const { ref, inView } = useInView();
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://eresclave.org/donar";

  const handleShareProgress = async () => {
    const remaining = goal - sponsored;
    let text = "";
    if (pct >= 100) {
      text = `🎉 ¡Ya superamos la meta! La campaña "${campaign.title}" ya tiene ${sponsored} ${campaign.unit || "unidades"} apadrinadas. ¡Gracias a quienes lo hicieron posible! 🎒\n\n¿Tú también quieres aportar?\n${shareUrl}`;
    } else if (pct >= 50) {
      text = `💪 Llevamos ${sponsored} de ${goal} ${campaign.unit || "unidades"} apadrinadas en "${campaign.title}" — ¡ya vamos más de la mitad! Solo faltan ${remaining}.\n\n¿Nos ayudas? 🎒\n${shareUrl}`;
    } else {
      text = `🎒 La campaña "${campaign.title}" está en marcha. Ya tenemos ${sponsored} ${campaign.unit || "unidades"} y faltan ${remaining}.\n\nÚnete: ${shareUrl}`;
    }
    if (navigator.share) {
      try { await navigator.share({ title: campaign.title, text, url: shareUrl }); } catch { }
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("¡Mensaje copiado!", { duration: 4000 });
    }
  };

  const eventDate = campaign.eventDate
    ? new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(campaign.eventDate))
    : null;

  return (
    <section ref={ref} className="bg-hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />
      <div className="container-tight relative grid lg:grid-cols-[1fr_400px] gap-8 sm:gap-14 items-center py-12 sm:py-24">
        <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
            <span className="inline-block bg-accent text-white text-[11px] sm:text-xs font-semibold px-3.5 py-1 sm:px-4 sm:py-1.5 rounded-full tracking-wide">
              {campaign.status === "active" ? "Campaña activa" : campaign.status === "completed" ? "Campaña completada" : "Próximamente"} — Las Charcas, Azua
            </span>
            {eventDate && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 text-white/80 text-[11px] sm:text-xs font-medium px-3 py-1 sm:py-1.5 rounded-full border border-white/20">
                <Calendar className="h-3 w-3" /> {eventDate}
              </span>
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05] text-white">
            {campaign.title}
          </h1>

          <p className="mt-5 text-white/75 text-lg leading-relaxed max-w-md font-normal">
            {campaign.description || <>Apadrina una {campaign.unit ? campaign.unit.slice(0, -1) : "unidad"} por{" "}
              <span className="font-semibold text-white">RD$ {price}</span>.
              Tu nombre quedará en el árbol de esta campaña.</>}
          </p>

          {/* Progress */}
          <div className="mt-10 bg-white/10 border border-white/15 rounded-2xl p-5 max-w-md backdrop-blur-sm">
            <div className="flex items-baseline justify-between mb-2.5">
              <span className="text-sm font-medium text-white/80">
                {campaign.status === "completed" ? (
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    ¡Campaña concluida con éxito! ({sponsored}/{goal})
                  </span>
                ) : pct >= 100 ? (
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    {pct === 100 ? "¡Meta alcanzada!" : "¡Meta superada!"} ({sponsored}/{goal})
                  </span>
                ) : (
                  `${sponsored} de ${goal} ${campaign.unit || "unidades"} apadrinadas`
                )}
              </span>
              <span className="text-sm font-bold text-white">{pct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20">
              <div className="h-full rounded-full bg-accent transition-all duration-1000" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/45">
              RD$ {raised.toLocaleString()} de RD$ {(goal * price).toLocaleString()} recaudados
            </p>
            <button onClick={handleShareProgress} className="mt-4 inline-flex items-center gap-2 text-white/70 hover:text-white text-xs font-medium transition-colors group">
              <Share2 className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
              Compartir progreso
            </button>
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {campaign.status === "completed" ? (
              <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 font-semibold px-6 py-3.5 rounded-full text-sm backdrop-blur-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Campaña concluida — Gracias por tu apoyo
              </div>
            ) : campaign.status === "upcoming" ? (
              <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 text-blue-300 font-semibold px-6 py-3.5 rounded-full text-sm backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-blue-300" />
                Próximamente disponible
              </div>
            ) : (
              <button onClick={onDonate} className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-7 py-3.5 rounded-full text-sm tracking-wide transition-all duration-200 shadow-warm">
                <Heart className="h-4 w-4" />
                Apadrinar {campaign.unit ? campaign.unit.slice(0, -1) : "unidad"}
              </button>
            )}
            <button
              onClick={() => document.getElementById("tree-section")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 border border-white/30 text-white hover:bg-white/10 font-medium px-6 py-3.5 rounded-full text-sm transition-all"
            >
              Ver el árbol <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className={cn("flex justify-center lg:justify-end transition-all duration-700 delay-150", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          
            {campaign.type === "backpacks" && (
              <img src={posterImg} alt={`Afiche de ${campaign.title}`} className="w-full max-w-[340px] rounded-2xl shadow-2xl ring-1 ring-white/10" />
            )}

        </div>
      </div>
    </section>
  );
}

function TreeSection({ backpacks, goal, price, onSelectBackpack, onDonate, campaign }: {
  backpacks: Backpack[]; goal: number; price: number;
  onSelectBackpack: (b: Backpack) => void; onDonate: () => void; campaign: Campaign;
}) {
  const isCompleted = campaign.status === "completed";
  const { ref, inView } = useInView(0.05);
  const sponsored = backpacks.filter(b => b.sponsored).length;
  return (
    <section id="tree-section" className="bg-card py-16 sm:py-20 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="max-w-2xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">El árbol de las mochilas</h2>
          <p className="mt-3 text-muted-foreground text-base leading-relaxed">Cada mochila apadrinada se ilumina con el nombre del donante.</p>
          <div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-primary ring-2 ring-primary/30" />Apadrinada ({sponsored})</span>
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm border-2 border-dashed border-border" />Disponible ({goal - sponsored})</span>
          </div>
        </div>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
          {backpacks.map((bp, i) => (
            <BackpackSlot
              key={bp.id}
              backpack={bp}
              delay={i * 18}
              visible={inView}
              onClick={() => {
                if (bp.sponsored) onSelectBackpack(bp);
                else if (isCompleted) toast("Esta campaña ya concluyó y no recibe nuevas donaciones.");
                else onDonate();
              }}
            />
          ))}
        </div>
        <div className="mt-10 flex items-center gap-4">
          {isCompleted ? (
            <div className="inline-flex items-center gap-2 bg-secondary border border-border text-muted-foreground font-semibold px-6 py-3 rounded-full text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Campaña concluida
            </div>
          ) : (
            <button onClick={onDonate} className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-6 py-3 rounded-full text-sm transition-all duration-200">
              <Heart className="h-4 w-4" />Apadrinar — RD$ {price}
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            {isCompleted ? "Árbol de donantes cerrado." : "Tu nombre aparecerá aquí."}
          </p>
        </div>
      </div>
    </section>
  );
}

function BackpackSlot({ backpack, delay, visible, onClick }: { backpack: Backpack; delay: number; visible: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={backpack.sponsored ? `Mochila #${backpack.id} — ${backpack.donorName}` : `Mochila #${backpack.id} — Disponible`}
      className={cn(
        "relative aspect-square rounded-xl flex flex-col items-center justify-center text-center p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        visible ? "opacity-100 scale-100" : "opacity-0 scale-90",
        backpack.sponsored ? "bg-primary hover:opacity-90 hover:-translate-y-0.5 shadow-soft ring-1 ring-primary/40" : "bg-secondary border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/80",
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {backpack.sponsored ? (
        <><span className="text-xl leading-none">🎒</span><span className="text-[8px] font-bold text-white/90 leading-tight mt-0.5 truncate w-full px-0.5">{backpack.donorName}</span><span className="text-[7px] text-white/50">#{backpack.id}</span></>
      ) : (
        <><span className="text-base opacity-20">🎒</span><span className="text-[8px] text-muted-foreground font-medium mt-0.5">#{backpack.id}</span></>
      )}
    </button>
  );
}

function LiveDonorsSection({ donors, price, onDonate, campaign }: { donors: Donor[]; price: number; onDonate: () => void; campaign: Campaign }) {
  const displayDonors = donors;
  const emoji = campaign.type === "medical" ? "🩺" : "🎒";
  const unitText = campaign.unit ? campaign.unit.slice(0, -1) : "unidad";
  const unitPlural = campaign.unit || "unidades";

  function timeAgo(ts: any): string {
    if (!ts?.toDate) return "Hace poco";
    const diff = Date.now() - ts.toDate().getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    return `Hace ${Math.floor(hrs / 24)} días`;
  }

  return (
    <section className="bg-secondary/40 border-b border-border py-12 sm:py-16">
      <div className="container-tight">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Últimos padrinos</h2>
            <p className="mt-1 text-sm text-muted-foreground">Personas que ya se han unido a esta causa</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            <span className="text-xs font-semibold text-accent">En vivo</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {displayDonors.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Heart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="font-semibold text-foreground">
                {campaign.status === "completed" ? "No se registraron donaciones públicas" : "Sé el primero en apadrinar"}
              </p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                {campaign.status === "completed" ? "Esta campaña ya ha sido concluida." : "Tu aporte marcará la diferencia y aparecerá aquí de inmediato."}
              </p>
              {campaign.status !== "completed" && (
                <button onClick={onDonate} className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                  Apadrinar ahora →
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto divide-y divide-border">
                {displayDonors.map((d, i) => (
                  <div key={d.id} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-secondary/50 transition-colors">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-base shrink-0">{emoji}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{d.donorName}</p>
                      <p className="text-xs text-muted-foreground">
                        RD$ {d.amount.toLocaleString()} · Apadrinó {d.units} {d.units > 1 ? unitPlural : unitText}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{timeAgo(d.createdAt)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border px-5 py-3.5 bg-secondary/30">
                {campaign.status === "completed" ? (
                  <p className="w-full text-center text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Lista cerrada · Meta completada
                  </p>
                ) : (
                  <button onClick={onDonate} className="w-full text-center text-sm font-semibold text-primary hover:underline">
                    Unirte a esta lista → Apadrinar ahora
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

interface CampaignUpdateFn {
  id: string;
  date: string;
  title: string;
  body: string;
  imageUrl?: string;
}



function UpdatesTimelineSection({ updates }: { updates: CampaignUpdateFn[] }) {
  const displayUpdates = updates;

  function formatDate(dateStr: string) {
    try {
      return new Intl.DateTimeFormat("es-DO", { day: "numeric", month: "long", year: "numeric" }).format(new Date(dateStr));
    } catch { return dateStr; }
  }

  return (
    <section className="py-14 sm:py-20">
      <div className="container-tight max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-10">
          Actualizaciones de la campaña
        </h2>

        {displayUpdates.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-3 opacity-30" />
            <p>Aún no hay actualizaciones para esta campaña.</p>
          </div>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-10 pl-12">
              {displayUpdates.map((u, i) => (
                <div key={u.id} className="relative">
                  {/* Dot */}
                  <div className="absolute -left-12 top-1 h-8 w-8 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <span className="text-sm">{i === 0 ? "🔴" : "✅"}</span>
                  </div>
                  {/* Card */}
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    {u.imageUrl && (
                      <div className="aspect-[16/7] overflow-hidden">
                        <img src={u.imageUrl} alt={u.title} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    )}
                    <div className="p-5">
                      <p className="text-xs text-muted-foreground font-medium mb-2">{formatDate(u.date)}</p>
                      <h3 className="font-bold text-foreground text-base mb-2">{u.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{u.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const FAQ_ITEMS = [
  { q: "¿Cómo garantizan que la ayuda llegue?", a: "Publicamos fotos y videos de cada entrega en nuestra sección 'Tu aporte, visible'. Cada mochila apadrinada tiene el nombre del donante en el árbol y recibe seguimiento fotográfico hasta la entrega." },
  { q: "¿Puedo donar desde el exterior?", a: "¡Sí! Aceptamos transferencias desde cuentas internacionales vía Remitly, Zelle o Western Money. Escríbenos por WhatsApp y te indicamos el método más conveniente para ti." },
  { q: "¿Dónde compran los útiles?", a: "Compramos en librerías y ferreterías locales de Las Charcas y Azua para apoyar la economía de nuestra propia comunidad y asegurar la calidad de los materiales." },
  { q: "¿Recibiré una confirmación de mi donación?", a: "Sí. En cuanto recibamos tu comprobante por WhatsApp, te respondemos con la confirmación y activamos tu mochila en el árbol de la campaña con tu nombre." },
  { q: "¿Puedo donar sin mi nombre?", a: "Por supuesto. Puedes indicarnos 'Anónimo' al enviar el comprobante y así aparecerá en el árbol." },
];

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="py-14 sm:py-20">
      <div className="container-tight max-w-3xl">
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mb-2">Preguntas frecuentes</h2>
        <p className="text-muted-foreground text-sm mb-10">Todo lo que necesitas saber antes de apadrinar.</p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-semibold text-sm text-foreground">{item.q}</span>
                {open === i ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Cómo apadrinar</h2>
          <p className="mt-3 text-muted-foreground">Tres pasos. Menos de cinco minutos.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={i} className={cn("transition-all duration-500", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5")} style={{ transitionDelay: `${i * 100}ms` }}>
              <span className="block text-4xl font-black text-primary/20 mb-4 tracking-tight">{s.number}</span>
              <h3 className="text-base font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <button onClick={onDonate} className="inline-flex items-center gap-2 border border-border bg-card text-foreground hover:bg-secondary font-medium px-6 py-3 rounded-full text-sm transition-all">
            Ver datos bancarios <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function PhotoGallerySection() {
  const { ref, inView } = useInView();
  const photos = [
    "/gallery/entrega-1.jpeg",
    "/gallery/entrega-2.jpeg",
    "/gallery/entrega-3.jpeg",
    "/gallery/entrega-4.jpeg",
    "/gallery/entrega-5.jpeg",
    "/gallery/entrega-6.jpeg",
  ];
  return (
    <section className="bg-card py-16 sm:py-20 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="max-w-xl mb-10">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Tu aporte, visible.</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed text-base">Cada mochila entregada será fotografiada y publicada aquí.</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {photos.map((src, i) => (
            <div key={i} className={cn("aspect-[4/3] rounded-2xl bg-secondary border border-border overflow-hidden transition-all duration-500", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")} style={{ transitionDelay: `${i * 60}ms` }}>
              <img src={src} alt={`Entrega de mochilas ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TransparencySection({ price, goal }: { price: number; goal: number }) {
  const { ref, inView } = useInView();
  const kitItems = ["Mochila escolar", "Cuadernos", "Lápices y borrador", "Sacapuntas y regla", "Colores y crayolas", "Tijeras escolares", "Útiles adicionales"];
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
          <div className={cn("transition-all duration-[600ms]", inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-5")}>
            <h2 className="text-3xl font-black tracking-tight text-foreground mb-2">Qué incluye cada mochila</h2>
            <p className="text-muted-foreground text-sm mb-8">RD$ {price} cubre un kit completo para comenzar el año escolar.</p>
            <ul className="space-y-0">
              {kitItems.map((item, i) => (
                <li key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-medium text-foreground">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div><p className="text-xs text-muted-foreground mb-0.5">Por mochila completa</p><p className="text-2xl font-black text-foreground">RD$ {price}</p></div>
              <div className="text-right"><p className="text-xs text-muted-foreground mb-0.5">Meta total</p><p className="text-sm font-semibold text-foreground">RD$ {(price * goal).toLocaleString()} · {goal} mochilas</p></div>
            </div>
          </div>
          <div className={cn("transition-all duration-[600ms] delay-100", inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-5")}>
            <div className="bg-hero-gradient text-white rounded-2xl p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/50 mb-6">Garantías de transparencia</p>
              <ul className="space-y-5">
                {guarantees.map((g, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <span className="flex-shrink-0 text-white/50 mt-0.5">{g.icon}</span>
                    <span className="text-sm text-white/80 leading-relaxed">{g.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-white/15">
                <p className="text-xs text-white/40 leading-relaxed">Esta campaña nace de la comunidad y rinde cuentas a la comunidad. Cero intermediarios políticos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CampaignFooter() {
  const share = () => {
    const text = "Apadrina una mochila escolar para un niño de Las Charcas. #EresClave";
    if (navigator.share) navigator.share({ title: "Eres Clave", text, url: window.location.href });
    else { navigator.clipboard.writeText(`${text} ${window.location.href}`); toast.success("Enlace copiado"); }
  };
  return (
    <section className="bg-hero-gradient py-14 sm:py-16">
      <div className="container-tight flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-3">Iniciativa comunitaria</p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight max-w-sm leading-tight">Comparte y lleguemos a la meta.</h2>
          <p className="mt-2 text-white/55 text-sm max-w-xs leading-relaxed">Cero política. 100% impacto. Las Charcas, Azua.</p>
        </div>
        <div className="flex flex-col gap-3 shrink-0">
          <button onClick={share} className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-6 py-3 rounded-full text-sm active:scale-95 transition-all">
            <Share2 className="h-4 w-4" /> Compartir campaña
          </button>
          <a href="https://wa.me/18297404861?text=Hola%2C%20quiero%20apadrinar%20una%20mochila" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-white/25 text-white/75 hover:text-white hover:border-white/50 font-medium px-6 py-3 rounded-full text-sm transition-all">
            <Phone className="h-4 w-4" /> Escribir por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}

function DonationModal({ onClose, campaign }: { onClose: () => void, campaign: Campaign }) {
  const [copied, setCopied] = useState<string | null>(null);
  const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); toast.success("Número copiado"); };
  const banks = [
    { name: "Banco Popular Dominicano", account: "808368880", holder: "Robinson Sánchez" },
    { name: "BHD León", account: "26817390011", holder: "Robinson Sánchez" },
    { name: "Banreservas", account: "9607080353", holder: "Robinson Sánchez" },
  ];
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" onClick={onBackdrop}>
      <div className="bg-card w-full sm:max-w-md max-h-[95vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <div className="sm:hidden flex justify-center pt-3 pb-1"><span className="w-10 h-1 rounded-full bg-border block" /></div>
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div><h2 className="text-base font-semibold text-foreground">Apadrinar {campaign.unit ? campaign.unit.slice(0, -1) : "unidad"}</h2><p className="text-xs text-muted-foreground mt-0.5">Transferencia bancaria — RD$ 450</p></div>
          <button onClick={onClose} className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-secondary transition-colors"><X className="h-4 w-4" /></button>
        </div>
        <div className="px-6 py-6 space-y-6">
          <div className="rounded-xl bg-secondary border border-border p-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Monto</p>
            <p className="text-4xl font-black text-foreground tracking-tight">RD$ 450</p>
            <p className="text-xs text-muted-foreground mt-1">por mochila escolar completa</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Cuentas bancarias</p>
            <div className="space-y-2">
              {banks.map((bank, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors">
                  <div><p className="text-xs font-semibold text-foreground">{bank.name}</p><p className="text-sm font-mono text-foreground mt-0.5">{bank.account}</p><p className="text-xs text-muted-foreground mt-0.5">{bank.holder}</p></div>
                  <button onClick={() => copyToClipboard(bank.account)} className="flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-card hover:text-primary transition-colors ml-3 border border-border"><Copy className="h-3.5 w-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
          <a href="https://wa.me/18297404861?text=Hola%2C%20acabo%20de%20transferir%20para%20apadrinar%20una%20mochila.%20Te%20env%C3%ADo%20el%20comprobante." target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full bg-accent hover:opacity-90 text-white rounded-xl px-5 py-4 transition-all">
            <div><p className="text-sm font-semibold">Enviar comprobante por WhatsApp</p><p className="text-xs text-white/65 mt-0.5">(829) 740-4861</p></div>
            <ArrowRight className="h-4 w-4 text-white/60 flex-shrink-0" />
          </a>
        </div>
      </div>
    </div>
  );
}

function BackpackModal({ backpack, onClose }: { backpack: Backpack; onClose: () => void }) {
  useEffect(() => { document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  const onBackdrop = (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); };
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" onClick={onBackdrop} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="bg-card rounded-2xl max-w-sm w-full shadow-card overflow-hidden border border-border">
        <div className="bg-hero-gradient px-6 py-8 text-center">
          <span className="text-4xl">🎒</span>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/60">Mochila #{backpack.id} — Apadrinada</p>
        </div>
        <div className="px-6 py-6">
          <h3 className="text-xl font-black text-foreground tracking-tight">{backpack.donorName}</h3>
          <p className="text-xs text-muted-foreground mt-1">Donante de esta mochila</p>
          {backpack.message && <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-l-2 border-primary/30 pl-4 italic">{backpack.message}</p>}
          <p className="mt-5 text-sm text-muted-foreground leading-relaxed">Esta mochila llegará a un niño de Las Charcas, Azua, gracias a <strong className="text-foreground font-semibold">{backpack.donorName}</strong>.</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                const msgs = [`Acabo de apadrinar la mochila #${backpack.id} para los niños de Las Charcas. ¡Únete! 🎒✨ ${window.location.href}`];
                const text = msgs[0];
                if (navigator.share) navigator.share({ title: "Eres Clave", text }).catch(() => { navigator.clipboard.writeText(text); toast.success("Mensaje copiado"); });
                else { navigator.clipboard.writeText(text); toast.success("Mensaje copiado"); }
              }}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold py-3 rounded-xl text-sm hover:opacity-90 transition-all"
            >
              <Share2 className="h-4 w-4" /> Compartir mi donación
            </button>
            <button onClick={onClose} className="w-full border border-border text-muted-foreground font-medium py-3 rounded-xl text-sm hover:bg-secondary transition-colors">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
