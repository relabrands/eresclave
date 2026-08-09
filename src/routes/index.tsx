import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Heart, Users, BookOpen,
  ShieldCheck, Target, Handshake, GraduationCap,
  TrendingUp, Camera, Calendar, CheckCircle2, Clock, MapPin
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { collection, query, onSnapshot, getDocs, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eres Clave · Plataforma de apoyo para Las Charcas" },
      { name: "description", content: "Eres Clave conecta a la comunidad de Las Charcas con recursos, voluntarios y donantes para impulsar a su juventud." },
      { property: "og:title", content: "Eres Clave · Plataforma de apoyo para Las Charcas" },
      { property: "og:description", content: "Útiles escolares, apadrinamiento y oportunidades para jóvenes de Las Charcas, Azua." },
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
      {/* subtle noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px"
        }}
      />

      <div className="container-tight relative py-20 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <span className="inline-block bg-accent text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide">
            Las Charcas, Azua — Desde 2026
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.02] tracking-tight">
            Una comunidad que<br />
            <span className="text-white/60">se levanta unida.</span>
          </h1>

          <p className="mt-7 text-white/70 text-xl leading-relaxed max-w-2xl font-normal">
            Eres Clave conecta a donantes, voluntarios y aliados con los jóvenes
            de Las Charcas que necesitan apoyo para estudiar, crecer y construir su futuro.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/donar"
              className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-7 py-4 rounded-full text-sm tracking-wide transition-all duration-200 shadow-warm"
            >
              <Heart className="h-4 w-4" />
              Apoyar la campaña
            </Link>
            <Link
              to="/iniciativa"
              className="inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white/10 font-medium px-6 py-4 rounded-full text-sm transition-all"
            >
              Conocer la plataforma <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 flex flex-wrap gap-x-12 gap-y-5">
            {[
              { value: "50", label: "mochilas · Meta 2026" },
              { value: "RD$ 450", label: "por mochila completa" },
              { value: "100%", label: "transparencia" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-black text-white">{s.value}</p>
                <p className="text-sm text-white/45 mt-0.5 font-normal">{s.label}</p>
              </div>
            ))}
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
  deadline?: string;
  link: string;
}

function ActiveCampaignsSection() {
  const { ref, inView } = useInView();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    // Listen to campaigns
    const qCamp = query(collection(db, "campaigns"));
    const unsubCamps = onSnapshot(qCamp, async (snap) => {
      const campsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      // For each campaign, count donations
      const finalCamps: Campaign[] = [];
      for (const camp of campsData) {
        const dontsQ = query(collection(db, "donations"), where("campaignId", "==", camp.id));
        const dontsSnap = await getDocs(dontsQ);
        finalCamps.push({
          id: camp.id,
          title: camp.title || "Sin título",
          description: camp.description || "",
          goal: camp.goal || 50,
          current: dontsSnap.size, // count of donations
          unit: camp.unit || "unidades",
          pricePerUnit: camp.pricePerUnit || 0,
          status: camp.status || "active",
          deadline: camp.deadline,
          link: "/donar", // For now pointing to /donar, later can be dynamic
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
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c, i) => (
            <CampaignCard key={c.id} campaign={c} delay={i * 80} visible={inView} />
          ))}

          {/* Upcoming placeholder */}
          <div
            className={cn(
              "rounded-2xl border-2 border-dashed border-border p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[220px] transition-all duration-500",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            )}
            style={{ transitionDelay: `${campaigns.length * 80}ms` }}
          >
            <Clock className="h-7 w-7 text-muted-foreground/40" />
            <div>
              <p className="text-sm font-semibold text-foreground">Próxima campaña</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Las campañas de becas y talleres estarán disponibles pronto.
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

  return (
    <div
      className={cn(
        "rounded-2xl border border-primary/20 bg-card p-6 flex flex-col shadow-soft hover:-translate-y-1 hover:shadow-card transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Status badge */}
      <div className="flex items-center justify-between mb-5">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
          Activa
        </span>
        {c.deadline && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> {c.deadline}
          </span>
        )}
      </div>

      {/* Content */}
      <h3 className="font-semibold text-base text-foreground mb-2">{c.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{c.description}</p>

      {/* Progress */}
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

      {/* CTA */}
      <Link
        to={c.link}
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
    <section className="bg-card py-16 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-5">
              Nuestra misión
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-[1.05]">
              Ningún joven de Las Charcas debería quedarse atrás.
            </h2>
            <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
              Las Charcas es una comunidad con talento, fuerza y voluntad. Lo que falta, a veces,
              son los recursos para dar el primer paso. Eres Clave existe para cerrar esa brecha —
              conectando a quienes quieren ayudar con quienes necesitan el apoyo.
            </p>
            <Link
              to="/iniciativa"
              className="mt-8 inline-flex items-center gap-2 text-primary font-semibold text-sm hover:gap-3 transition-all"
            >
              Leer sobre la iniciativa <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className={cn("grid grid-cols-2 gap-4 transition-all duration-700 delay-150", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            {[
              { icon: <Target className="h-5 w-5" />, title: "Objetivo claro", desc: "Útiles, becas y oportunidades para jóvenes de 6 a 18 años." },
              { icon: <ShieldCheck className="h-5 w-5" />, title: "Transparencia total", desc: "Cada peso donado tiene foto, nombre y fecha de entrega." },
              { icon: <Users className="h-5 w-5" />, title: "Comunidad activa", desc: "Vecinos, voluntarios y aliados trabajando en el mismo propósito." },
              { icon: <TrendingUp className="h-5 w-5" />, title: "Crecimiento real", desc: "Arrancamos con útiles y expandimos hacia becas y talleres." },
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
      link: "/donar",
      linkLabel: "Apadrinar una mochila",
    },
    {
      icon: <Handshake className="h-5 w-5" />,
      title: "Apadrinamiento",
      tag: "Activo",
      active: true,
      desc: "Conéctate con un joven de la comunidad y apoya su trayectoria escolar de forma continua.",
      link: "/donar",
      linkLabel: "Conocer más",
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
              Cómo trabajamos
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md text-sm leading-relaxed">
              Comenzamos con lo urgente y construimos desde ahí.
              Cada programa se activa cuando la comunidad está lista.
            </p>
          </div>
          <Link
            to="/donar"
            className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-3 transition-all"
          >
            Ver campaña activa <ArrowRight className="h-4 w-4" />
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

/* ─── HOW TO HELP ─── */
function HowHelpSection() {
  const { ref, inView } = useInView();

  const ways = [
    {
      number: "01",
      title: "Donar útiles o dinero",
      desc: "Aporta RD$ 450 para una mochila completa, o lleva materiales directamente a un centro de acopio.",
      cta: { label: "Ir a donar", to: "/donar" },
    },
    {
      number: "02",
      title: "Apadrinar a un joven",
      desc: "Conviértete en el apoyo sostenido de un estudiante de la comunidad durante el año escolar.",
      cta: { label: "Ver cómo", to: "/donar" },
    },
    {
      number: "03",
      title: "Compartir la campaña",
      desc: "Llegar a 50 mochilas depende de cuántas personas conozcan esta iniciativa. Comparte.",
      cta: null,
    },
  ];

  return (
    <section className="bg-card py-16 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="max-w-xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Participa
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Cómo puedes ayudar
          </h2>
          <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
            No hace falta vivir en Las Charcas para ser parte del cambio.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-8">
          {ways.map((w, i) => (
            <div
              key={i}
              className={cn(
                "transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="block text-5xl font-black text-primary/15 mb-5 tracking-tight">{w.number}</span>
              <h3 className="font-semibold text-foreground mb-2">{w.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{w.desc}</p>
              {w.cta && (
                <Link
                  to={w.cta.to}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
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
    <section className="bg-hero-gradient py-16 sm:py-24" ref={ref}>
      <div className="container-tight">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-16 items-center">

          {/* Text */}
          <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent mb-5">
              Impacto real
            </p>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              Lo que logra una mochila.
            </h2>
            <p className="mt-5 text-white/65 leading-relaxed">
              No es solo una mochila. Es el mensaje de que alguien en algún lugar del país —
              o del mundo — creyó en ese niño. Eso cambia todo.
            </p>
            <Link
              to="/donar"
              className="mt-8 inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-7 py-3.5 rounded-full text-sm transition-all"
            >
              <Heart className="h-4 w-4" /> Apadrinar una mochila
            </Link>
          </div>

          {/* Stats grid */}
          <div className={cn("grid grid-cols-2 gap-4 transition-all duration-700 delay-150", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            {[
              { value: "50", label: "Mochilas · meta 2026" },
              { value: "RD$ 450", label: "Costo por mochila completa" },
              { value: "7", label: "Artículos por mochila" },
              { value: "100%", label: "Fondos destinados a útiles" },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl bg-white/8 border border-white/12 p-6">
                <p className="text-3xl font-black text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-white/45 mt-1 leading-snug">{s.label}</p>
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
      title: "Nacido en la comunidad",
      desc: "Eres Clave surge desde Las Charcas, no desde afuera. Conocemos las necesidades porque somos parte de ellas.",
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-primary" />,
      title: "Cero política",
      desc: "Esta plataforma no tiene banderas ni afiliaciones. El único compromiso es con el bienestar de los jóvenes.",
    },
    {
      icon: <Camera className="h-5 w-5 text-primary" />,
      title: "Rendición de cuentas",
      desc: "Cada donación, cada mochila y cada entrega queda documentada con fotos, nombres y fechas. Sin excepciones.",
    },
    {
      icon: <Users className="h-5 w-5 text-primary" />,
      title: "Colectivo",
      desc: "No dependemos de una sola persona. La plataforma crece con cada voluntario, aliado y donante que se suma.",
    },
  ];

  return (
    <section className="bg-secondary/40 py-16 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="max-w-xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-3">
            Quiénes somos
          </p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Una plataforma de la comunidad, para la comunidad.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed max-w-lg">
            Eres Clave no tiene un solo dueño. La sostiene cada persona que elige actuar —
            donar, compartir, volunteerar o simplemente creer.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {values.map((v, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl bg-card border border-border p-6 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-soft",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <span className="block mb-4">{v.icon}</span>
              <h3 className="font-semibold text-sm text-foreground mb-2">{v.title}</h3>
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
    <section className="bg-card py-16 sm:py-20" ref={ref}>
      <div className="container-tight">
        <div
          className={cn(
            "rounded-3xl bg-hero-gradient p-10 sm:p-16 text-center relative overflow-hidden transition-all duration-700",
            inView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          {/* texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundSize: "180px"
            }}
          />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 mb-5">
              Campaña 2026 — Las Charcas, Azua
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-2xl mx-auto">
              Sé parte de las 50 mochilas.
            </h2>
            <p className="mt-5 text-white/60 max-w-lg mx-auto leading-relaxed">
              Cada mochila apadrinada es un año escolar posible para un niño de Las Charcas.
              Tu nombre quedará en el árbol de esta campaña.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/donar"
                className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-8 py-4 rounded-full text-sm tracking-wide transition-all shadow-warm"
              >
                <Heart className="h-4 w-4" />
                Apadrinar — RD$ 450
              </Link>
              <Link
                to="/iniciativa"
                className="inline-flex items-center gap-2 border border-white/25 text-white/80 hover:text-white hover:border-white/50 font-medium px-6 py-4 rounded-full text-sm transition-all"
              >
                Conocer más <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
