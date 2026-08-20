import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft, MapPin, Clock, Heart, Loader2, Sparkles } from "lucide-react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Story } from "./impacto-real.index";

export const Route = createFileRoute("/impacto-real/$id")({
  component: StoryDetailPage,
});

const MOCK_STORIES: Story[] = [
  { id: "mock-1", personName: "Doña Carmen", quote: "Nunca pensé que recibiríamos los útiles a tiempo para el lunes.", description: "Doña Carmen es mamá de tres niños en el Sector Central. Cuando llegamos con las mochilas, sus hijos no podían creerlo. Este año, por primera vez, entran al colegio listos desde el primer día.\n\nLa entrega se realizó en la plaza comunitaria del sector. Más de 40 familias se reunieron esa tarde. Los niños corrían con sus mochilas como si fueran la cosa más valiosa del mundo, porque para ellos, lo era.\n\nDoña Carmen nos dijo que el año pasado tuvo que pedir prestado dinero para comprar un par de cuadernos. Este año, gracias a los padrinos de la campaña, sus tres hijos tienen todo lo necesario para empezar el año con dignidad.", category: "mochilas", sector: "Sector Central", imageUrl: "/gallery/entrega-5.jpeg", createdAt: null, published: true, slug: "dona-carmen" },
  { id: "mock-2", personName: "Miguelito, 9 años", quote: "Mi mochila es azul. Es la primera mochila que tengo nueva.", description: "Miguelito nunca había tenido una mochila propia. Usaba una bolsa de tela de su mamá para llevar sus cuadernos. Con la mochila que recibió, fue el primero en llegar a su salón el primer día de clases.\n\nSu mamá, la señora Bienvenida, nos contó que Miguelito durmió esa noche con la mochila puesta al lado de su cama. 'No quería que nadie se la quitara', dijo entre risas y lágrimas.\n\nMiguelito va en el tercer grado. Su maestro dice que es uno de los estudiantes más aplicados del salón. Con este kit escolar, tiene todo lo que necesita para terminar el año con las mejores notas.", category: "mochilas", sector: "Los Uveros", imageUrl: "/gallery/entrega-2.jpeg", createdAt: null, published: true, slug: "miguelito" },
  { id: "mock-3", personName: "Familia Martínez", quote: "El doctor nos explicó todo con paciencia. Nunca habíamos tenido esa atención.", description: "La familia Martínez llevaba meses sin acceso a atención médica. Durante la jornada, el hijo menor recibió su primera consulta pediátrica y tratamiento para una infección que tenía semanas sin atender.\n\nEl padre de familia, Don Pedro, tiene tres hijos. El más pequeño, de 4 años, presentaba síntomas que preocupaban a la familia pero que nunca habían podido atender por falta de recursos y acceso a médicos en el área.\n\nDurante el operativo, el pediatra diagnosticó una infección de vías respiratorias y recetó el tratamiento adecuado. La familia salió con los medicamentos en mano, sin costo alguno. 'Es la primera vez que uno de mis hijos ve a un doctor de verdad', dijo Don Pedro.", category: "medico", sector: "La Loma", imageUrl: "/gallery/entrega-3.jpeg", createdAt: null, published: true, slug: "familia-martinez" },
  { id: "mock-4", personName: "Señora Rosario", quote: "Esto es una bendición. Mis nietos van a poder estudiar bien este año.", description: "La señora Rosario cría sola a cuatro nietos. Cuando recibió los kits escolares para todos, se echó a llorar. Sus nietos ahora tienen cuadernos, lápices y una mochila cada uno, listos para el nuevo año escolar.", category: "mochilas", sector: "Las Charcas Centro", imageUrl: "/gallery/entrega-4.jpeg", createdAt: null, published: true, slug: "senora-rosario" },
  { id: "mock-5", personName: "Don Julio", quote: "Vine al operativo y me atendieron en media hora. Ahora sé qué tengo y cómo controlarlo.", description: "Don Julio, 67 años, vino al operativo médico con la esperanza de revisar su presión arterial. Salió con su diagnóstico, medicamentos para tres meses, y por primera vez, entiende cómo cuidar su salud.", category: "medico", sector: "El Rincón", imageUrl: "/gallery/entrega-6.jpeg", createdAt: null, published: true, slug: "don-julio" },
];

const CATEGORY_LABELS: Record<string, string> = {
  mochilas: "🎒 Mochilas Escolares",
  raciones: "🍲 Raciones",
  medico: "🩺 Operativo Médico",
  otro: "📦 Otro",
};

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

function StoryDetailPage() {
  const { id } = Route.useParams();
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check mock stories first
    const mock = MOCK_STORIES.find(s => s.slug === id || s.id === id);
    if (mock) { setStory(mock); setLoading(false); return; }

    // Try Firestore
    const q = query(collection(db, "stories"), where("slug", "==", id), limit(1));
    getDocs(q).then(snap => {
      if (!snap.empty) {
        setStory({ id: snap.docs[0].id, ...snap.docs[0].data() } as Story);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4">😔</p>
            <h1 className="text-xl font-bold mb-2">Historia no encontrada</h1>
            <Link to="/impacto-real" className="text-sm text-primary font-semibold hover:underline">← Ver todas las historias</Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const date = story.createdAt?.toDate ? story.createdAt.toDate() : null;
  const paragraphs = story.description.split("\n\n").filter(Boolean);

  return (
    <div className="min-h-screen flex flex-col bg-background pb-20 md:pb-0" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="container-tight py-5">
          <Link to="/impacto-real" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Todas las historias
          </Link>
        </div>

        {/* Hero image */}
        <div className="container-tight max-w-3xl">
          {story.imageUrl && (
            <div className="aspect-[16/9] sm:aspect-[2/1] rounded-2xl overflow-hidden bg-secondary mb-8">
              <img src={story.imageUrl} alt={story.personName} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Meta pill */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full">
              <Sparkles className="h-3 w-3" /> {CATEGORY_LABELS[story.category] ?? story.category}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {story.sector}</span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" /> {timeAgo(date)}</span>
          </div>

          {/* Content */}
          <div className="space-y-6">
            <h1 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
              Conoce a {story.personName}.
            </h1>

            <blockquote className="border-l-4 border-primary pl-5 py-1">
              <p className="text-lg sm:text-xl font-bold text-foreground italic leading-snug">
                "{story.quote}"
              </p>
              <footer className="mt-2 text-sm font-semibold text-primary">— {story.personName}</footer>
            </blockquote>

            <div className="space-y-4">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-base text-muted-foreground leading-relaxed">{p}</p>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="my-10 border-t border-border" />

          {/* CTA */}
          <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="flex-1">
              <h3 className="font-bold text-foreground text-lg mb-1">Sé parte de la próxima historia.</h3>
              <p className="text-sm text-muted-foreground">Con tan solo RD$ 450 puedes apadrinar una mochila y crear un impacto como este.</p>
            </div>
            <Link to="/donar" className="shrink-0 inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-all shadow-warm">
              <Heart className="h-4 w-4" /> Apadrinar ahora
            </Link>
          </div>

          <div className="mt-8 pb-10">
            <Link to="/impacto-real" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Más historias de impacto
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
