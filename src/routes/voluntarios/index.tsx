import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight, Heart, Users, Zap, Globe,
  MapPin, Smartphone, CheckCircle2, Star,
  Calendar, Shield, Award
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/voluntarios/")({
  head: () => ({
    meta: [
      { title: "Voluntarios · Eres Clave · Las Charcas" },
      { name: "description", content: "Sé parte de los Voluntarios Eres Clave. Voluntarios Locales en Las Charcas y Voluntarios Digitales en la Diáspora. Juntos hacemos posible cada campaña." },
      { property: "og:title", content: "Voluntarios Eres Clave · Las Charcas" },
      { property: "og:description", content: "Sé Local o Digital. Ambos mueven Las Charcas hacia adelante." },
    ],
  }),
  component: VoluntariosPage,
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

function VoluntariosPage() {
  const [volunteerCount, setVolunteerCount] = useState<number | null>(null);

  useEffect(() => {
    const q = query(collection(db, "volunteers"), where("active", "==", true));
    getDocs(q).then(snap => setVolunteerCount(snap.size)).catch(() => setVolunteerCount(0));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <HeroSection count={volunteerCount} />
        <TwoTracksSection />
        <ImpactSection />
        <OnboardingSection />
        <IdentityCardSection />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ─── HERO ─── */
function HeroSection({ count }: { count: number | null }) {
  return (
    <section className="bg-hero-gradient relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px"
        }}
      />

      <div className="container-tight relative py-20 sm:py-28 lg:py-32">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-accent text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-8 tracking-wide">
            <Users className="h-3.5 w-3.5" /> Voluntarios Eres Clave
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.02] tracking-tight">
            Únete como voluntario.<br />
            <span className="text-white/60">Las Charcas te necesita.</span>
          </h1>

          <p className="mt-7 text-white/70 text-xl leading-relaxed max-w-2xl font-normal">
            Para que Eres Clave crezca de manera sostenible y ejecute proyectos como el
            Operativo Médico de febrero, necesitamos manos. Locales y Digitales. 
            Tú decides desde dónde aportas.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              to="/voluntarios/unirse"
              className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-7 py-4 rounded-full text-sm tracking-wide transition-all shadow-warm"
            >
              <Heart className="h-4 w-4" />
              Quiero ser voluntario
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white/10 font-medium px-6 py-4 rounded-full text-sm transition-all"
            >
              Cómo funciona <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="mt-16 flex flex-wrap gap-x-12 gap-y-5">
            {[
              { value: count !== null ? `+${count}` : "—", label: "voluntarios activos" },
              { value: "2", label: "frentes de acción" },
              { value: "0", label: "requerimientos para unirte" },
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

/* ─── TWO TRACKS ─── */
function TwoTracksSection() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-card py-16 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4">Los dos frentes</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Dos roles. Un mismo propósito.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            No importa dónde estés. Si vives en Las Charcas o en cualquier parte del mundo,
            hay un rol perfecto para ti como voluntario.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* LOCAL */}
          <div className={cn(
            "rounded-3xl border-2 border-primary/20 bg-card p-8 transition-all duration-700 hover:-translate-y-1 hover:shadow-card",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}>
            <div className="flex items-start gap-5 mb-7">
              <div className="text-5xl flex-shrink-0">🏘️</div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Frente Local · Las Charcas
                </span>
                <h3 className="text-2xl font-black text-foreground mt-2">Los Locales</h3>
                <p className="text-muted-foreground text-sm mt-1">Los brazos operativos de la comunidad.</p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Son los jóvenes y líderes comunitarios que están en Las Charcas. Ayudan a recibir los útiles,
              armar las mochilas, organizar las filas del operativo médico y repartir raciones o cualquier
              actividad de apoyo en el pueblo.
            </p>

            <div className="space-y-2.5">
              {[
                "Recepción y armado de mochilas y kits escolares",
                "Logística en operativos médicos y comunitarios",
                "Entrega directa de raciones y donaciones",
                "Identificación de familias que necesitan apoyo",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DIGITAL */}
          <div className={cn(
            "rounded-3xl border-2 border-accent/20 bg-card p-8 transition-all duration-700 delay-150 hover:-translate-y-1 hover:shadow-card",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}>
            <div className="flex items-start gap-5 mb-7">
              <div className="text-5xl flex-shrink-0">💻</div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2.5 py-1 rounded-full">
                  Frente Digital · Diáspora & Santo Domingo
                </span>
                <h3 className="text-2xl font-black text-foreground mt-2">Los Digitales</h3>
                <p className="text-muted-foreground text-sm mt-1">El motor de amplificación y apoyo.</p>
              </div>
            </div>

            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Son charqueros y aliados en Santo Domingo, Santiago, Estados Unidos o cualquier parte del mundo.
              Amplifican el mensaje, consiguen padrinos en sus lugares de trabajo y hacen contactos con marcas.
            </p>

            <div className="space-y-2.5">
              {[
                "Compartir campañas en redes sociales y WhatsApp",
                "Conseguir padrinos y donantes en sus trabajos y círculos",
                "Contactos con marcas, empresas y profesionales",
                "Coordinación de centros de acopio y donaciones físicas",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-xs text-foreground font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── IMPACT STRIP ─── */
function ImpactSection() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-secondary/40 py-16 sm:py-20 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="grid sm:grid-cols-3 gap-8 text-center max-w-4xl mx-auto">
          {[
            { value: "100%", label: "De las donaciones van directo a la causa", icon: <Shield className="h-5 w-5" /> },
            { value: "2", label: "Frentes trabajando en sincronía", icon: <Users className="h-5 w-5" /> },
            { value: "0 RD$", label: "Costo para registrarte y participar", icon: <Award className="h-5 w-5" /> },
          ].map((item, i) => (
            <div
              key={i}
              className={cn(
                "transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <span className="inline-flex items-center justify-center p-3 rounded-2xl bg-card border border-border text-primary mb-4">
                {item.icon}
              </span>
              <p className="text-4xl font-black text-foreground">{item.value}</p>
              <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto leading-relaxed">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── ONBOARDING STEPS ─── */
function OnboardingSection() {
  const { ref, inView } = useInView();

  const steps = [
    {
      number: "01",
      icon: <Smartphone className="h-5 w-5" />,
      title: "Regístrate en 2 minutos",
      desc: "Solo tu nombre, correo, WhatsApp y cómo prefieres ayudar. Sin formularios largos ni burocracia.",
    },
    {
      number: "02",
      icon: <Users className="h-5 w-5" />,
      title: "Elige tu frente",
      desc: "¿Estás en Las Charcas? Eres Local. ¿Estás en otro lugar? Eres Digital. Tan simple como eso.",
    },
    {
      number: "03",
      icon: <Award className="h-5 w-5" />,
      title: "Obtén tu carnet digital",
      desc: "Al registrarte, recibes tu carnet de voluntario con tu nombre, número de ID y QR listo para compartir.",
    },
  ];

  return (
    <section className="bg-card py-16 sm:py-24 border-b border-border" id="como-funciona" ref={ref}>
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            En 3 pasos, ya eres parte de los voluntarios.
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(
                "text-center transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex flex-col items-center">
                <span className="text-6xl font-black text-primary/10 tracking-tight">{step.number}</span>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary -mt-4 mb-5">
                  {step.icon}
                </div>
              </div>
              <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            to="/voluntarios/unirse"
            className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-8 py-4 rounded-full text-sm tracking-wide transition-all shadow-warm"
          >
            <Heart className="h-4 w-4" /> Registrarme ahora
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── IDENTITY CARD PREVIEW ─── */
function IdentityCardSection() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-hero-gradient py-16 sm:py-24" ref={ref}>
      <div className="container-tight">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-accent mb-5">
              <Star className="h-3.5 w-3.5 fill-current" /> Identidad Digital
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.05]">
              Tu carnet de<br />
              <span className="text-white/60">voluntario digital.</span>
            </h2>
            <p className="mt-6 text-white/65 text-lg leading-relaxed">
              Más que un registro — es tu credencial. Con tu nombre, número único, tipo de
              voluntario y un QR que enlaza a tu perfil. Lista para compartir en tus redes
              sociales y decir: <em className="text-white/90">"Yo soy voluntario en Eres Clave."</em>
            </p>
            <div className="mt-8 space-y-3">
              {[
                "Tu nombre y número único #EC-XXX",
                "Tipo: Voluntario Local o Digital",
                "Fecha desde que formas parte",
                "QR código con tu perfil público",
                "Descargable como imagen para Stories",
              ].map((feat) => (
                <div key={feat} className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-white/75 text-sm">{feat}</span>
                </div>
              ))}
            </div>
            <Link
              to="/voluntarios/unirse"
              className="mt-8 inline-flex items-center gap-2 border border-white/25 text-white hover:bg-white/10 font-medium px-6 py-4 rounded-full text-sm transition-all"
            >
              Obtener mi carnet <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Card Preview */}
          <div className={cn("flex justify-center transition-all duration-700 delay-200", inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
            <div className="w-72 relative" style={{ perspective: "1000px" }}>
              {/* Card mock */}
              <div className="rounded-3xl overflow-hidden shadow-2xl" style={{
                background: "linear-gradient(135deg, #004A45 0%, #006E66 50%, #004A45 100%)",
                border: "1px solid rgba(255,255,255,0.15)"
              }}>
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Comunidad</p>
                    <p className="text-white font-black text-sm tracking-wide">ERES CLAVE</p>
                  </div>
                  <div className="border border-accent/50 rounded px-2 py-0.5">
                    <p className="text-accent text-[10px] font-bold tracking-wider">AGO 2026</p>
                  </div>
                </div>

                {/* Body */}
                <div className="px-6 py-6">
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mb-1">Voluntario Local</p>
                  <h3 className="text-white font-black text-2xl leading-tight mb-1">Tu Nombre</h3>
                  <p className="text-accent text-sm font-medium">Las Charcas, Azua</p>

                  <div className="mt-10 flex items-end justify-between">
                    <div>
                      <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-0.5">ID NUMBER</p>
                      <p className="text-white font-mono font-bold text-sm">#EC-001</p>
                    </div>
                    {/* QR placeholder */}
                    <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-0.5 w-10 h-10">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className={cn(
                            "rounded-[1px]",
                            [0, 2, 4, 6, 8].includes(i) ? "bg-gray-900" : "bg-gray-300"
                          )} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom */}
                <div className="px-6 pb-5 pt-2 border-t border-white/10">
                  <p className="text-white/25 text-[9px] text-center tracking-wider">
                    Toca la tarjeta para voltear y compartir ↻
                  </p>
                </div>
              </div>

              {/* Glow */}
              <div className="absolute -inset-4 rounded-3xl opacity-20 blur-2xl -z-10"
                style={{ background: "radial-gradient(circle, #e85d04, transparent 70%)" }} />
            </div>
          </div>
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
            "rounded-3xl border border-border p-10 sm:p-16 text-center transition-all duration-700",
            inView ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
        >
          <span className="text-5xl mb-6 block">🤝</span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            ¿Listo para sumarte como voluntario?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-lg mx-auto leading-relaxed">
            No necesitas experiencia. No necesitas dinero. Solo necesitas querer
            hacer algo por Las Charcas. Eso es suficiente.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/voluntarios/unirse"
              className="inline-flex items-center gap-2 bg-accent hover:opacity-90 active:scale-[0.98] text-white font-semibold px-8 py-4 rounded-full text-sm tracking-wide transition-all shadow-warm"
            >
              <Heart className="h-4 w-4" />
              Registrarme como voluntario
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 border border-border text-foreground hover:bg-secondary font-medium px-6 py-4 rounded-full text-sm transition-all"
            >
              Volver al inicio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
