import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Heart, Users, BookOpen,
  ShieldCheck, Target, Handshake, GraduationCap,
  TrendingUp, Camera, Calendar, Clock, MapPin,
  Stethoscope, Zap, Globe
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { collection, query, onSnapshot, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fundación Eres Clave · Las Charcas, Azua" },
      { name: "description", content: "Fundación Eres Clave transforma comunidades en Las Charcas a través de educación, salud y oportunidades. Únete como donante o voluntario." },
      { property: "og:title", content: "Fundación Eres Clave · Las Charcas, Azua" },
      { property: "og:description", content: "Educación, salud y oportunidades para Las Charcas. Cada campaña marca la diferencia." },
    ],
  }),
  component: HomePage,
});

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

function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <HeroSection />
        <ActiveCampaignsSection />
        <MissionSection />
        <ProgramsSection />
        <VolunteerTeaser />
        <HowHelpSection />
        <ImpactSection />
        <CommunitySection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ─── HERO ─── */
function HeroSection() {
  return (
    <section className="bg-hero-gradient relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px"
        }}
      />

      <div className="container-tight relative py-12 sm:py-24 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Text */}
          <div className="max-w-3xl">
            <span className="inline-block sm:hidden bg-accent text-white text-[11px] font-semibold px-3.5 py-1 rounded-full mb-4 tracking-wide">
              Impulso Comunitario · Las Charcas, Azua
            </span>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] sm:leading-[1.04] tracking-tight">
              Unidos por nuestra comunidad.<br />
              <span className="text-white/60">Impulsando cada vida.</span>
            </h1>

            <p className="mt-4 sm:mt-6 text-white/75 text-sm sm:text-lg leading-relaxed max-w-2xl font-normal">
              Educación, salud y oportunidades para los jóvenes y familias de Las Charcas.
              Eres Clave conecta donantes, voluntarios y aliados con quienes más lo necesitan —
              con total transparencia y rendición de cuentas.
            </p>

            <div className="mt-7 sm:mt-10 flex flex-wrap gap-2.5 sm:gap-3">
              <Link
                to="/donar"
                className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-5 py-3 sm:px-7 sm:py-4 rounded-full text-xs sm:text-sm tracking-wide transition-all duration-200 shadow-warm"
              >
                <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Ver campañas activas
              </Link>
              <Link
                to="/voluntarios"
                className="inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white/10 font-medium px-5 py-3 sm:px-6 sm:py-4 rounded-full text-xs sm:text-sm transition-all"
              >
                Ser voluntario <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
            </div>

            {/* Stats row */}
            <div className="mt-10 sm:mt-16 flex flex-wrap gap-x-8 sm:gap-x-12 gap-y-4 sm:gap-y-5">
              {[
                { value: "2", label: "campañas activas" },
                { value: "+150", label: "familias impactadas en 2026" },
                { value: "100%", label: "transparencia total" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl sm:text-3xl font-black text-white">{s.value}</p>
                  <p className="text-xs sm:text-sm text-white/50 mt-0.5 font-normal">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right Collage */}
          <div className="mt-4 lg:mt-0 relative">
            <p className="text-white/60 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-4">Nuestras actividades recientes</p>

            <div className="grid grid-cols-2 grid-rows-2 gap-3 sm:gap-4 h-[280px] sm:h-[400px] lg:h-[460px]">
              <div className="row-span-2 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-[3px] sm:border-4 border-white/10 group bg-white/5">
                <img src="/gallery/entrega-2.jpeg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Actividad" loading="lazy" />
              </div>
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-[3px] sm:border-4 border-white/10 group bg-white/5">
                <img src="/gallery/entrega-3.jpeg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Actividad" loading="lazy" />
              </div>
              <div className="rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-[3px] sm:border-4 border-white/10 group bg-white/5">
                <img src="/gallery/entrega-1.jpeg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 object-[center_30%]" alt="Actividad" loading="lazy" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4 h-24 sm:h-32">
              <div className="rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-[3px] border-white/10 group bg-white/5">
                <img src="/gallery/entrega-4.jpeg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Actividad" loading="lazy" />
              </div>
              <div className="rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-[3px] border-white/10 group bg-white/5">
                <img src="/gallery/entrega-5.jpeg" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Actividad" loading="lazy" />
              </div>
              <Link to="/voluntarios" className="rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-[3px] border-white/10 group bg-white/5 flex items-center justify-center relative hover:border-white/30 transition-colors">
                <img src="/gallery/entrega-6.jpeg" className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-700" alt="Actividad" loading="lazy" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase group-hover:text-accent transition-colors flex items-center gap-1">¡Únete! <ArrowRight className="h-3 w-3" /></span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── ACTIVE CAMPAIGNS ─── */

interface Campaign {
  id: string;
  title: string;
  description: string;
  goal: number;
  current: number;
  unit: string;
  pricePerUnit: number;
  status: "active" | "completed" | "upcoming";
  slug?: string;
  eventDate?: string;
}

function ActiveCampaignsSection() {
  const { ref, inView } = useInView();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const qCamp = query(collection(db, "campaigns"));
    const unsubCamps = onSnapshot(qCamp, async (snap) => {
      const campsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const finalCamps: Campaign[] = [];
      for (const camp of campsData) {
        const dontsQ = query(collection(db, "donations"), where("campaignId", "==", camp.id));
        const dontsSnap = await getDocs(dontsQ);
        finalCamps.push({
          id: camp.id,
          title: camp.title || "Sin título",
          description: camp.description || "",
          goal: camp.goal || 50,
          current: dontsSnap.size,
          unit: camp.unit || "unidades",
          pricePerUnit: camp.pricePerUnit || 0,
          status: camp.status || "active",
          slug: camp.slug,
          eventDate: camp.eventDate,
        });
      }
      setCampaigns(finalCamps);
    });
    return () => unsubCamps();
  }, []);

  return (
    <section className="bg-card py-16 sm:py-20 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">En curso</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">Campañas activas</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md">
              Estas son las iniciativas abiertas ahora mismo. Tu apoyo llega directo y tiene seguimiento en tiempo real.
            </p>
          </div>
          <Link to="/donar" className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
            Ver todas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} delay={i * 80} visible={inView} />
          ))}

          <div
            className={cn(
              "rounded-2xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[220px] transition-all duration-500",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
            style={{ transitionDelay: `${campaigns.length * 80}ms` }}
          >
            <Clock className="h-7 w-7 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold text-foreground">Más campañas en camino</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Becas, talleres y más operativos médicos. Pronto.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CampaignCard({ campaign: c, delay, visible }: { campaign: Campaign; delay: number; visible: boolean }) {
  const pct = Math.min(Math.round((c.current / c.goal) * 100), 100);
  const raised = c.current * c.pricePerUnit;
  const total = c.goal * c.pricePerUnit;
  const href = c.slug ? `/donar/${c.slug}` : `/donar`;

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-card p-6 flex flex-col shadow-soft hover:-translate-y-1 hover:shadow-card transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-5">
        <span className={cn(
          "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
          c.status === "upcoming"
            ? "text-amber-600 bg-amber-50"
            : "text-primary bg-primary/10"
        )}>
          <span className={cn("h-1.5 w-1.5 rounded-full inline-block", c.status === "upcoming" ? "bg-amber-500" : "bg-primary animate-pulse")} />
          {c.status === "upcoming" ? "Próxima" : "Activa"}
        </span>
        {c.eventDate && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {new Date(c.eventDate + "T00:00:00").toLocaleDateString("es-DO", { month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      <h3 className="font-semibold text-base text-foreground mb-2">{c.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{c.description}</p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-xs font-medium text-foreground">
            {c.current} de {c.goal} {c.unit}
          </span>
          <span className="text-xs font-semibold text-primary">{pct}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-1000"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          RD$ {raised.toLocaleString()} de RD$ {total.toLocaleString()}
        </p>
      </div>

      <Link
        to={href}
        className="mt-5 inline-flex items-center justify-center gap-2 w-full bg-accent hover:opacity-90 text-white font-semibold text-sm py-3 rounded-xl transition-all active:scale-[0.98]"
      >
        <Heart className="h-4 w-4" /> Apoyar esta campaña
      </Link>
    </div>
  );
}

/* ─── MISSION ─── */
function MissionSection() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-card py-12 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-16 items-center">
          <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3 sm:mb-5">
              Nuestra misión
            </p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.08] sm:leading-[1.05]">
              Ningún joven de Las Charcas debería quedarse atrás.
            </h2>
            <p className="mt-4 sm:mt-6 text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
              Las Charcas es una comunidad con talento, fuerza y voluntad. Lo que falta, a veces,
              son los recursos para dar el primer paso. Eres Clave existe para cerrar esa brecha —
              conectando a quienes quieren ayudar con quienes necesitan el apoyo.
            </p>
            <Link
              to="/iniciativa"
              className="mt-6 sm:mt-8 inline-flex items-center gap-2 text-primary font-semibold text-xs sm:text-sm hover:gap-3 transition-all"
            >
              Leer sobre la iniciativa <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Link>
          </div>

          <div className={cn("grid grid-cols-2 gap-4 transition-all duration-700 delay-150", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            {[
              { icon: <Target className="h-5 w-5" />, title: "Tres pilares", desc: "Educación, Salud y Oportunidades. Todo lo que Las Charcas necesita para crecer." },
              { icon: <ShieldCheck className="h-5 w-5" />, title: "Transparencia total", desc: "Cada peso donado tiene foto, nombre y fecha de entrega." },
              { icon: <Users className="h-5 w-5" />, title: "Red de Voluntarios", desc: "Locales en el pueblo y digitales en la diáspora, trabajando juntos." },
              { icon: <TrendingUp className="h-5 w-5" />, title: "Crecimiento real", desc: "Útiles escolares hoy, operativos médicos mañana, becas en el futuro." },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5 hover:shadow-soft hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-primary mb-3 block">{card.icon}</span>
                <h3 className="font-semibold text-sm text-foreground mb-1">{card.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── PROGRAMS ─── */
function ProgramsSection() {
  const { ref, inView } = useInView();

  const programs = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Útiles Escolares",
      tag: "Activo",
      active: true,
      desc: "Mochilas completas con todo lo necesario para comenzar el año escolar. RD$ 450 por kit.",
      link: "/donar/50-mochilas-las-charcas",
      linkLabel: "Apadrinar una mochila",
    },
    {
      icon: <Stethoscope className="h-5 w-5" />,
      title: "Operativo Médico",
      tag: "Feb 2026",
      active: true,
      desc: "Consultas generales, pediatría y medicamentos gratuitos para más de 150 familias de la comunidad.",
      link: "/donar/operativo-medico",
      linkLabel: "Ver el operativo",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Becas Educativas",
      tag: "Próximamente",
      active: false,
      desc: "Apoyo económico para continuar estudios secundarios, técnicos o universitarios.",
      link: null,
      linkLabel: null,
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Talleres de Oficio",
      tag: "Próximamente",
      active: false,
      desc: "Capacitaciones prácticas en áreas con demanda real: tecnología, emprendimiento y más.",
      link: null,
      linkLabel: null,
    },
  ];

  return (
    <section className="bg-secondary/40 py-16 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
              Programas
            </p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Tres pilares. Un propósito.
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md text-sm leading-relaxed">
              Educación, salud y oportunidades. Cada programa se activa cuando la comunidad está lista.
            </p>
          </div>
          <Link
            to="/donar"
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            Ver campañas <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {programs.map((prog, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl bg-card border p-6 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-soft",
                prog.active ? "border-primary/20" : "border-border",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              <div className="flex items-start justify-between mb-5">
                <span className={cn("p-2.5 rounded-xl", prog.active ? "bg-secondary text-primary" : "bg-muted text-muted-foreground")}>
                  {prog.icon}
                </span>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                  prog.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
                  {prog.tag}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2">{prog.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">{prog.desc}</p>
              {prog.link && prog.linkLabel && (
                <Link
                  to={prog.link}
                  className="mt-5 text-sm font-semibold text-primary inline-flex items-center gap-1 hover:gap-2 transition-all"
                >
                  {prog.linkLabel} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── VOLUNTEER TEASER ─── */
function VolunteerTeaser() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-hero-gradient py-12 sm:py-24" ref={ref}>
      <div className="container-tight">
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left: text */}
          <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-accent mb-3 sm:mb-5">
              <Users className="h-3.5 w-3.5" /> Voluntarios Eres Clave
            </span>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.08] sm:leading-[1.05]">
              Para que Eres Clave crezca,<br />
              <span className="text-white/60">necesitamos manos.</span>
            </h2>
            <p className="mt-4 sm:mt-6 text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed">
              Los voluntarios son las personas que hacen posible cada campaña. Sin ellos,
              las 50 mochilas no se arman. El operativo médico no se organiza.
              La diáspora no se enteraría.
            </p>
            <Link
              to="/voluntarios"
              className="mt-6 sm:mt-8 inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-6 py-3.5 sm:px-7 sm:py-4 rounded-full text-xs sm:text-sm transition-all shadow-warm"
            >
              <Users className="h-4 w-4" /> Ser Voluntario
            </Link>
          </div>

          {/* Right: two tracks */}
          <div className={cn("grid gap-3 sm:gap-4 transition-all duration-700 delay-200", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <div className="rounded-2xl bg-white/8 border border-white/15 p-5 sm:p-6 hover:bg-white/12 transition-all">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">🏘️</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Frente Local</p>
                  <h3 className="text-base sm:text-lg font-black text-white">Los de Las Charcas</h3>
                </div>
              </div>
              <p className="text-white/65 text-xs sm:text-sm leading-relaxed">
                Los brazos operativos. Reciben los útiles, arman las mochilas,
                organizan las filas del operativo médico y distribuyen en el campo.
                Tú conoces el pueblo. Eso vale más que cualquier recurso.
              </p>
            </div>

            <div className="rounded-2xl bg-white/8 border border-white/15 p-5 sm:p-6 hover:bg-white/12 transition-all">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <span className="text-2xl sm:text-3xl">💻</span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">Frente Digital</p>
                  <h3 className="text-base sm:text-lg font-black text-white">Los de la Diáspora</h3>
                </div>
              </div>
              <p className="text-white/65 text-xs sm:text-sm leading-relaxed">
                El motor de amplificación. Comparten los links en redes, consiguen padrinos
                en sus trabajos, hacen contactos con marcas y coordinan recolecciones
                en Santo Domingo y el exterior.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── HOW TO HELP ─── */
function HowHelpSection() {
  const { ref, inView } = useInView();

  const ways = [
    {
      number: "01",
      title: "Donar a una campaña",
      desc: "Aporta RD$ 450 para una mochila escolar, o apadrina la atención médica de una familia por RD$ 500.",
      cta: { label: "Ver campañas", to: "/donar" },
    },
    {
      number: "02",
      title: "Sumarte como voluntario",
      desc: "Eres Local o Eres Digital. Ambos son necesarios. Regístrate, obtén tu carnet digital y empieza a ayudar.",
      cta: { label: "Ser voluntario", to: "/voluntarios" },
    },
    {
      number: "03",
      title: "Compartir la misión",
      desc: "Cada persona que conoce Eres Clave puede convertirse en un donante, un voluntario o un aliado. Comparte.",
      cta: null,
    },
  ];

  return (
    <section className="bg-card py-12 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3 sm:mb-4">Cómo participar</p>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
            Hay muchas formas de ser clave.
          </h2>
          <p className="mt-3 text-muted-foreground text-xs sm:text-sm leading-relaxed">
            No importa el tamaño del aporte ni desde dónde lo hagas. Todo suma.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
          {ways.map((w, i) => (
            <div
              key={w.number}
              className={cn(
                "rounded-3xl border border-border bg-card p-6 sm:p-8 flex flex-col justify-between hover:shadow-card hover:-translate-y-1 transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div>
                <span className="text-3xl sm:text-4xl font-black text-primary/15 tracking-tight font-mono">{w.number}</span>
                <h3 className="text-base sm:text-lg font-black text-foreground mt-3 mb-2">{w.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              </div>
              {w.cta && (
                <Link
                  to={w.cta.to}
                  className="mt-5 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                >
                  {w.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── IMPACT ─── */
function ImpactSection() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-secondary/40 py-16 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">

          <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              Impacto real
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight leading-tight">
              Cada acción tiene un nombre y una cara.
            </h2>
            <p className="mt-5 text-muted-foreground leading-relaxed">
              No somos una caja negra. Cada mochila entregada tiene foto.
              Cada operativo médico tiene lista de pacientes. Cada donación es pública.
              Esa es la única forma de crecer con confianza.
            </p>
            <Link
              to="/donar"
              className="mt-8 inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all"
            >
              <Heart className="h-4 w-4" /> Apoyar ahora
            </Link>
          </div>

          <div className={cn("grid grid-cols-2 gap-4 transition-all duration-700 delay-150", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            {[
              { value: "50", label: "Mochilas · meta 2026" },
              { value: "150", label: "Familias · Operativo Médico" },
              { value: "4", label: "Especialidades médicas gratuitas" },
              { value: "100%", label: "Fondos destinados al campo" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border p-6 hover:shadow-soft transition-all">
                <p className="text-3xl font-black text-foreground tracking-tight">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── COMMUNITY ─── */
function CommunitySection() {
  const { ref, inView } = useInView();

  const values = [
    {
      icon: <MapPin className="h-5 w-5 text-primary" />,
      title: "Nacida en la comunidad",
      desc: "Eres Clave surge desde Las Charcas, no desde afuera. Conocemos las necesidades porque somos parte de ellas.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      title: "Cero política",
      desc: "Esta iniciativa no tiene banderas ni afiliaciones. El único compromiso es con el bienestar de la gente.",
    },
    {
      icon: <Camera className="h-5 w-5 text-primary" />,
      title: "Rendición de cuentas",
      desc: "Cada donación, cada mochila y cada paciente atendido queda documentado con fotos, nombres y fechas.",
    },
    {
      icon: <Globe className="h-5 w-5 text-primary" />,
      title: "Diáspora incluida",
      desc: "Desde Santo Domingo, Nueva York o Madrid. Si eres de Las Charcas o te importa, tienes lugar aquí.",
    },
  ];

  return (
    <section className="bg-card py-12 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="max-w-xl mb-10 sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Quiénes somos
          </p>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground leading-[1.08]">
            Una iniciativa de la comunidad, para la comunidad.
          </h2>
          <p className="mt-3 sm:mt-4 text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-lg">
            Eres Clave no tiene un solo dueño. La sostiene cada persona que elige actuar —
            donar, compartir, ser voluntario o simplemente creer.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {values.map((v, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl bg-card border border-border p-5 sm:p-6 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-soft",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="block mb-3 sm:mb-4">{v.icon}</span>
              <h3 className="font-semibold text-sm text-foreground mb-1.5">{v.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FINAL CTA ─── */
function FinalCTA() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-card py-12 sm:py-20" ref={ref}>
      <div className="container-tight">
        <div
          className={cn(
            "rounded-3xl bg-hero-gradient p-6 sm:p-16 text-center relative overflow-hidden transition-all duration-700",
            inView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "180px"
            }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50 mb-3 sm:mb-5">
              Impulso Comunitario · Las Charcas, Azua
            </p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mx-auto">
              Las Charcas tiene todo.<br />
              Solo necesita tu clave.
            </h2>
            <p className="mt-3 sm:mt-5 text-white/70 text-xs sm:text-base max-w-lg mx-auto leading-relaxed">
              Dona, sé voluntario o simplemente comparte.
              Cada acción cuenta. Cada persona es clave.
            </p>
            <div className="mt-7 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
              <Link
                to="/donar"
                className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-xs sm:text-sm tracking-wide transition-all shadow-warm"
              >
                <Heart className="h-4 w-4" />
                Ver campañas activas
              </Link>
              <Link
                to="/voluntarios"
                className="inline-flex items-center gap-2 border border-white/25 text-white/80 hover:text-white hover:border-white/50 font-medium px-5 py-3 sm:px-6 sm:py-4 rounded-full text-xs sm:text-sm transition-all"
              >
                <Users className="h-4 w-4" /> Ser voluntario
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
