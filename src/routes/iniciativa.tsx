import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Quote, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useEffect, useRef } from "react";

export const Route = createFileRoute("/iniciativa")({
  head: () => ({
    meta: [
      { title: "La iniciativa · Eres Clave" },
      { name: "description", content: "Conoce la historia, el propósito y el impacto de Eres Clave en Las Charcas." },
    ],
  }),
  component: IniciativaPage,
});

function useInView(threshold = 0.2) {
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

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

const steps = [
  {
    n: "01",
    title: "Identificamos",
    desc: "Caminamos las calles, hablamos con familias, maestros y líderes comunitarios para encontrar a quienes más lo necesitan.",
    emoji: "🚶🏽",
  },
  {
    n: "02",
    title: "Conectamos",
    desc: "Enlazamos a cada joven con un padrino o una donación específica. La relación es real y directa.",
    emoji: "🤝",
  },
  {
    n: "03",
    title: "Acompañamos",
    desc: "Seguimiento para asegurar el avance. Porque una mochila sola no es suficiente.",
    emoji: "❤️",
  },
  {
    n: "04",
    title: "Celebramos",
    desc: "Cada logro — una calificación, un grado superado — es de toda la comunidad.",
    emoji: "🎉",
  },
];

function IniciativaPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative">
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <HeroIniciativa />
        <WhyWeExist />
        <HowWeWork />
        <CTASection />
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroIniciativa() {
  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white py-20 sm:py-28">
      {/* Chalkboard texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
      />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-[color:var(--orange-warm)]/10 blur-3xl" />
      </div>
      <div className="container-tight max-w-3xl relative">
        <h1 className="animate-fade-in-up text-4xl sm:text-6xl font-black leading-[1.05]">
          Una promesa a la{" "}
          <span className="text-[color:var(--yellow-sun)]">juventud de Las Charcas</span>
        </h1>
        <p className="animate-fade-in-up delay-100 mt-6 text-lg sm:text-xl text-white/85 leading-relaxed">
          Crecimos en Las Charcas y conocemos de cerca lo que significa no tener los recursos 
          cuando empieza el año escolar. <strong className="text-white">Eres Clave</strong> es la respuesta
          a esa realidad: una red comunitaria que asegura que ningún joven se quede atrás.
        </p>
      </div>
    </section>
  );
}

function WhyWeExist() {
  const { ref, inView } = useInView();
  return (
    <section className="container-tight py-20 sm:py-28" ref={ref}>
      <div className="grid lg:grid-cols-2 gap-14 items-start">
        <div className={cn("transition-all duration-700", inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8")}>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            ¿Por qué existimos?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
            Porque la diferencia entre un joven que sigue estudiando y uno que abandona muchas veces es
            tan pequeña como una mochila, un par de zapatos o una persona que le diga{" "}
            <strong className="text-foreground italic">"tú puedes"</strong>.
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            En Las Charcas, los recursos son escasos pero el talento es enorme. Nuestra misión es
            cerrar esa brecha, un joven a la vez, con la fuerza de toda la comunidad.
          </p>

          <div className="mt-8 p-5 rounded-2xl bg-secondary border">
            <p className="font-bold mb-1">¿Cuándo arrancamos?</p>
            <p className="text-muted-foreground text-sm leading-relaxed">
              La iniciativa inicia en 2026 con la campaña de útiles escolares para la apertura.
              Estamos en la fase de recolección. Tú puedes ser parte desde el primer día.
            </p>
          </div>
        </div>

        {/* Quote card */}
        <div className={cn("transition-all duration-700 delay-200", inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8")}>
          <div className="rounded-3xl bg-hero-gradient text-white p-8 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
            <Quote className="h-12 w-12 text-white/20 mb-6" />
            <p className="text-xl sm:text-2xl font-display font-bold leading-snug">
              "No queremos lástima. Queremos comunidad. Queremos que estos muchachos sepan que alguien
              cree en ellos antes de que ellos crean en sí mismos."
            </p>
            <div className="mt-8 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-warm-gradient grid place-items-center font-black text-lg flex-shrink-0 shadow-warm">
                EC
              </div>
              <div>
                <p className="font-bold">Comunidad Las Charcas</p>
                <p className="text-sm text-white/70">Proyecto Eres Clave</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowWeWork() {
  const { ref, inView } = useInView();
  return (
    <section className="bg-secondary/40 py-20" ref={ref}>
      <div className="container-tight">
        <div className="max-w-xl mb-12">
          <h2 className="text-3xl sm:text-4xl font-black">¿Cómo trabajamos?</h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Un proceso sencillo y humano. Sin burocracia, sin letra pequeña.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div
              key={s.n}
              className={cn(
                "rounded-3xl bg-card border p-6 shadow-soft hover:-translate-y-2 hover:shadow-card transition-all duration-300 relative overflow-hidden",
                inView ? "animate-fade-in-up" : "opacity-0"
              )}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="absolute top-0 right-0 text-7xl font-black text-muted-foreground/10 leading-none select-none pr-4 pt-2">
                {s.n}
              </div>
              <span className="text-3xl">{s.emoji}</span>
              <h3 className="mt-4 font-display font-bold text-lg">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="container-tight py-20">
      <div className="rounded-3xl bg-card border shadow-card p-10 sm:p-14 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black">
              ¿Te unirías a esta misión?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed max-w-lg">
              No hace falta mucho. Con lo que tú tienes, puedes cambiar la historia de un joven de Las Charcas.
              Y lo mejor: puedes verlo pasar en tiempo real.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link
              to="/donar"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-warm-gradient text-white font-bold shadow-warm hover:shadow-glow hover:scale-105 transition-all duration-200 text-lg whitespace-nowrap"
            >
              <Heart className="h-5 w-5 group-hover:animate-pulse-heart" />
              Quiero apoyar
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border border-border font-semibold hover:bg-secondary transition-colors"
            >
              Volver al inicio <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
