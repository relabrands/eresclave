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
      { title: "Únete al Escuadrón · Fundación Eres Clave" },
      { name: "description", content: "Sé parte del Escuadrón Eres Clave. Voluntarios Locales en Las Charcas y Voluntarios Digitales en la Diáspora. Juntos hacemos posible cada campaña." },
      { property: "og:title", content: "Únete al Escuadrón Eres Clave" },
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
            <Zap className="h-3.5 w-3.5" /> Escuadrón Eres Clave
          </span>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.02] tracking-tight">
            Únete al Escuadrón.<br />
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
            No importa dónde estés. Si vives en Las Charcas o en Nueva York,
            hay un rol perfecto para ti en el Escuadrón.
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
                <p className="text-muted-foreground text-sm mt-1">Los brazos operativos de la fundación.</p>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-7">
              Son los jóvenes que están en el pueblo y hacen posible que cada campaña pase
              del plan a la realidad. Sin ellos, las mochilas no llegan, el operativo médico
              no se organiza y la ración no se distribuye.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Recibir y organizar las donaciones físicas",
                "Armar kits escolares y mochilas",
                "Organizar filas y logística de operativos",
                "Documentar con fotos cada entrega",
                "Ser el puente entre la fundación y las familias",
              ].map((task) => (
                <div key={task} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{task}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-secondary/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Requiere presencia física</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Necesitas estar disponible para los días de campaña en Las Charcas.
              </p>
            </div>
          </div>

          {/* DIGITAL */}
          <div className={cn(
            "rounded-3xl border-2 border-primary/20 bg-card p-8 transition-all duration-700 delay-150 hover:-translate-y-1 hover:shadow-card",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}>
            <div className="flex items-start gap-5 mb-7">
              <div className="text-5xl flex-shrink-0">💻</div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  Frente Digital · SD / Diáspora
                </span>
                <h3 className="text-2xl font-black text-foreground mt-2">Los Digitales</h3>
                <p className="text-muted-foreground text-sm mt-1">El motor de amplificación de la fundación.</p>
              </div>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-7">
              Son los voluntarios en Santo Domingo, el Cibao, los Estados Unidos, España o
              donde estés. Su trabajo es hacer que el mundo se entere de lo que pasa en
              Las Charcas y convertir esa atención en apoyo real.
            </p>

            <div className="space-y-3 mb-8">
              {[
                "Compartir campañas en redes sociales y grupos de WhatsApp",
                "Conseguir padrinos en sus trabajos y círculos",
                "Hacer contactos con marcas o empresas aliadas",
                "Coordinar recolecciones físicas en la capital",
                "Crear contenido que amplifica el impacto",
              ].map((task) => (
                <div key={task} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{task}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-secondary/60 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">100% remoto</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Puedes contribuir desde cualquier lugar del mundo con tu teléfono o computadora.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── IMPACT ─── */
function ImpactSection() {
  const { ref, inView } = useInView();

  const impacts = [
    {
      emoji: "🎒",
      title: "Un voluntario local",
      value: "50 mochilas",
      desc: "puede ayudar a armar y entregar en un solo día de campaña.",
    },
    {
      emoji: "🩺",
      title: "Un voluntario local",
      value: "150 familias",
      desc: "puede guiar durante el operativo médico de un día.",
    },
    {
      emoji: "📣",
      title: "Un voluntario digital",
      value: "10× más alcance",
      desc: "genera al compartir en sus redes sociales con una sola publicación.",
    },
    {
      emoji: "🤝",
      title: "Un voluntario digital",
      value: "1 aliado nuevo",
      desc: "puede conseguir al hacer una sola conversación con su empresa.",
    },
  ];

  return (
    <section className="bg-secondary/40 py-16 sm:py-24 border-b border-border" ref={ref}>
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4">Impacto de tu participación</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            Un voluntario. Un impacto enorme.
          </h2>
          <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
            Esto es lo que puede lograr una sola persona comprometida.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {impacts.map((item, i) => (
            <div
              key={i}
              className={cn(
                "rounded-2xl bg-card border border-border p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:shadow-soft",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              )}
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              <div className="text-4xl mb-4">{item.emoji}</div>
              <p className="text-xs text-muted-foreground mb-2">{item.title}</p>
              <p className="text-2xl font-black text-foreground mb-2">{item.value}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── ONBOARDING ─── */
function OnboardingSection() {
  const { ref, inView } = useInView();

  const steps = [
    {
      number: "01",
      icon: <Smartphone className="h-5 w-5" />,
      title: "Regístrate en 2 minutos",
      desc: "Entra con tu cuenta de Google. Solo necesitamos tu nombre, tipo de voluntario y ciudad.",
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
      title: "Obtén tu tarjeta de identidad",
      desc: "Al registrarte, recibes tu tarjeta digital de voluntario. Con tu nombre, número y QR. Lista para compartir.",
    },
  ];

  return (
    <section className="bg-card py-16 sm:py-24 border-b border-border" id="como-funciona" ref={ref}>
      <div className="container-tight">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary mb-4">Cómo funciona</p>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
            En 3 pasos, ya eres parte del Escuadrón.
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
              voluntario y un QR que enlaza a tu perfil. Lista para compartir en tu historia
              de Instagram y decir: <em className="text-white/90">"Yo soy voluntario en Eres Clave."</em>
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
                background: "linear-gradient(135deg, #0d1f2d 0%, #1a3a5c 50%, #0d1f2d 100%)",
                border: "1px solid rgba(255,255,255,0.12)"
              }}>
                {/* Top bar */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Fundación</p>
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
          <span className="text-5xl mb-6 block">🚀</span>
          <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            ¿Listo para ser parte del Escuadrón?
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
