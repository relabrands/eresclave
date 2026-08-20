import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import {
  Search, MapPin, Clock, ArrowRight
} from "lucide-react";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const Route = createFileRoute("/impacto-real/")({
  head: () => ({
    meta: [
      { title: "Impacto Real · Eres Clave · Las Charcas" },
      { name: "description", content: "Conoce las historias reales de las familias y niños de Las Charcas, documentadas en el momento exacto en que reciben tu aporte." },
    ],
  }),
  component: ImpactoRealPage,
});

export interface Story {
  id: string;
  personName: string;
  quote: string;
  description: string;
  category: "mochilas" | "raciones" | "medico" | "otro";
  sector: string;
  imageUrl: string;
  createdAt: any;
  published: boolean;
  slug?: string;
}

const CATEGORIES = [
  { value: "all", label: "Todas" },
  { value: "mochilas", label: "🎒 Mochilas" },
  { value: "raciones", label: "🍲 Raciones" },
  { value: "medico", label: "🩺 Médico" },
  { value: "otro", label: "📦 Otro" },
];

const MOCK_STORIES: Story[] = [
  {
    id: "mock-1",
    personName: "Doña Carmen",
    quote: "Nunca pensé que recibiríamos los útiles a tiempo para el lunes.",
    description: "Doña Carmen es mamá de tres niños en el Sector Central. Cuando llegamos con las mochilas, sus hijos no podían creerlo. Este año, por primera vez, entran al colegio listos desde el primer día.",
    category: "mochilas",
    sector: "Sector Central",
    imageUrl: "/gallery/entrega-5.jpeg",
    createdAt: null,
    published: true,
    slug: "dona-carmen",
  },
  {
    id: "mock-2",
    personName: "Miguelito, 9 años",
    quote: "Mi mochila es azul. Es la primera mochila que tengo nueva.",
    description: "Miguelito nunca había tenido una mochila propia. Usaba una bolsa de tela de su mamá para llevar sus cuadernos. Con la mochila que recibió, fue el primero en llegar a su salón el primer día de clases.",
    category: "mochilas",
    sector: "Los Uveros",
    imageUrl: "/gallery/entrega-2.jpeg",
    createdAt: null,
    published: true,
    slug: "miguelito",
  },
  {
    id: "mock-3",
    personName: "Familia Martínez",
    quote: "El doctor nos explicó todo con paciencia. Nunca habíamos tenido esa atención.",
    description: "La familia Martínez llevaba meses sin acceso a atención médica. Durante la jornada, el hijo menor recibió su primera consulta pediátrica y tratamiento para una infección que tenía semanas sin atender.",
    category: "medico",
    sector: "La Loma",
    imageUrl: "/gallery/entrega-3.jpeg",
    createdAt: null,
    published: true,
    slug: "familia-martinez",
  },
  {
    id: "mock-4",
    personName: "Señora Rosario",
    quote: "Esto es una bendición. Mis nietos van a poder estudiar bien este año.",
    description: "La señora Rosario cría sola a cuatro nietos. Cuando recibió los kits escolares para todos, se echó a llorar. Sus nietos ahora tienen cuadernos, lápices y una mochila cada uno, listos para el nuevo año escolar.",
    category: "mochilas",
    sector: "Las Charcas Centro",
    imageUrl: "/gallery/entrega-4.jpeg",
    createdAt: null,
    published: true,
    slug: "senora-rosario",
  },
  {
    id: "mock-5",
    personName: "Don Julio",
    quote: "Vine al operativo y me atendieron en media hora. Ahora sé qué tengo y cómo controlarlo.",
    description: "Don Julio, 67 años, vino al operativo médico con la esperanza de revisar su presión arterial. Salió con su diagnóstico, medicamentos para tres meses, y por primera vez, entiende cómo cuidar su salud.",
    category: "medico",
    sector: "El Rincón",
    imageUrl: "/gallery/entrega-6.jpeg",
    createdAt: null,
    published: true,
    slug: "don-julio",
  },
];

function timeAgo(date: Date | null): string {
  if (!date) return "Hace poco";
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Hace 1 día";
  if (days < 30) return `Hace ${days} días`;
  const months = Math.floor(days / 30);
  return months === 1 ? "Hace 1 mes" : `Hace ${months} meses`;
}

function categoryLabel(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.label ?? cat;
}

function useInView(threshold = 0.1) {
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
  }, []);
  return { ref, inView };
}

function StoryCard({ story, index, inView }: { story: Story; index: number; inView: boolean }) {
  const date = story.createdAt?.toDate ? story.createdAt.toDate() : null;
  return (
    <div
      className={cn(
        "group bg-card rounded-2xl border border-border shadow-soft overflow-hidden transition-all duration-500 hover:shadow-md hover:-translate-y-0.5",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="flex flex-col sm:flex-row">
        <div className="sm:w-52 sm:shrink-0 aspect-[16/10] sm:aspect-auto overflow-hidden bg-secondary">
          {story.imageUrl ? (
            <img src={story.imageUrl} alt={story.personName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-primary/5">🌟</div>
          )}
        </div>
        <div className="flex-1 p-5 sm:p-6 flex flex-col gap-3">
          <p className="text-base sm:text-lg font-bold text-foreground leading-snug">"{story.quote}"</p>
          <p className="text-sm font-semibold text-primary">{story.personName}</p>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{story.description}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-auto pt-1">
            <span className="text-xs text-muted-foreground font-medium">{categoryLabel(story.category)}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {story.sector}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {timeAgo(date)}</span>
          </div>
          <Link to="/impacto-real/$id" params={{ id: story.slug ?? story.id }} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
            Ver historia completa <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function ImpactoRealPage() {
  const [firestoreStories, setFirestoreStories] = useState<Story[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const { ref, inView } = useInView(0.05);

  useEffect(() => {
    try {
      const q = query(collection(db, "stories"), where("published", "==", true), orderBy("createdAt", "desc"));
      const unsub = onSnapshot(q, (snap) => {
        setFirestoreStories(snap.docs.map(d => ({ id: d.id, ...d.data() } as Story)));
      }, () => {});
      return () => unsub();
    } catch {}
  }, []);

  const allStories = [
    ...firestoreStories,
    ...MOCK_STORIES.filter(m => !firestoreStories.some(f => f.slug === m.slug)),
  ];

  const filtered = allStories.filter(s => {
    const matchCat = category === "all" || s.category === category;
    const matchSearch = search === "" ||
      s.personName.toLowerCase().includes(search.toLowerCase()) ||
      s.quote.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <section className="bg-hero-gradient relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-[0.035]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`, backgroundSize: "180px" }} />
          <div className="container-tight relative py-14 sm:py-24">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 bg-accent text-white text-xs font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
                Historias Reales
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] tracking-tight">
                Impacto<br /><span className="text-white/60">sin filtros.</span>
              </h1>
              <p className="mt-5 text-white/75 text-base sm:text-lg leading-relaxed max-w-xl">
                Conoce las historias reales de las familias y niños de Las Charcas, documentadas en el momento exacto en que reciben tu aporte.
              </p>
              <div className="mt-8 flex items-center gap-3 flex-wrap">
                <span className="text-white/50 text-sm">{allStories.length} historias documentadas</span>
                <span className="text-white/20">·</span>
                <span className="text-white/50 text-sm">Las Charcas, Azua</span>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky filter bar */}
        <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-lg border-b border-border shadow-soft">
          <div className="container-tight py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar historia o nombre..." className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all" />
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
              {CATEGORIES.map(cat => (
                <button key={cat.value} onClick={() => setCategory(cat.value)} className={cn("shrink-0 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all", category === cat.value ? "bg-primary text-white" : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80")}>
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stories Feed */}
        <section className="py-10 sm:py-14" ref={ref}>
          <div className="container-tight max-w-4xl">
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-4xl mb-4">🔍</p>
                <p className="text-muted-foreground font-medium">No se encontraron historias con ese filtro.</p>
                <button onClick={() => { setSearch(""); setCategory("all"); }} className="mt-4 text-sm text-primary font-semibold hover:underline">Ver todas las historias</button>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {filtered.map((story, i) => (
                  <StoryCard key={story.id} story={story} index={i} inView={inView} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA bottom */}
        <section className="bg-hero-gradient py-14 sm:py-20">
          <div className="container-tight text-center">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Tu aporte crea la próxima historia.</h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto text-sm sm:text-base">Cada donación, por pequeña que sea, se convierte en una historia real de transformación.</p>
            <Link to="/donar" className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-7 py-4 rounded-full text-sm transition-all shadow-warm">
              Ver campañas activas <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
