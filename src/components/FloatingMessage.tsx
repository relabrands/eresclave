import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Heart, X } from "lucide-react";

const messages = [
  {
    title: "Un pequeño empujón",
    text: "\"La educación es el arma más poderosa para cambiar el mundo.\" Tu aporte construye esperanza.",
    emoji: "✨",
  },
  {
    title: "Sé la chispa",
    text: "Una simple mochila puede ser la motivación que un estudiante necesita para no rendirse.",
    emoji: "🎒",
  },
  {
    title: "Transforma su futuro",
    text: "Con RD$ 450 garantizas que un joven de Las Charcas inicie su año escolar con dignidad.",
    emoji: "🌱",
  },
  {
    title: "El poder de dar",
    text: "Cuando das desde el corazón, inspiras a toda una comunidad a ser mejor.",
    emoji: "❤️",
  },
];

export function FloatingMessage() {
  const [showMessage, setShowMessage] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on dashboard and auth
  const isHidden = pathname.startsWith("/dashboard") || pathname === "/auth";

  useEffect(() => {
    // Pick a random message on mount
    setMessageIndex(Math.floor(Math.random() * messages.length));
    
    // Show message after a small delay
    const timer = setTimeout(() => {
      setShowMessage(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [pathname]); // Also can re-trigger when navigating

  if (isHidden || !showMessage) return null;

  const msg = messages[messageIndex];

  return (
    <div className="fixed bottom-[88px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-50 animate-fade-in-up bg-white text-slate-800 p-5 rounded-2xl shadow-2xl border border-slate-100 max-w-sm">
      <button 
        onClick={() => setShowMessage(false)}
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Cerrar mensaje"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3">
        <span className="text-2xl">{msg.emoji}</span>
        <div>
          <p className="font-semibold text-sm mb-1">{msg.title}</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">
            {msg.text}
          </p>
          <Link 
            to="/donar"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-accent px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
            onClick={() => setShowMessage(false)}
          >
            <Heart className="h-3 w-3" /> Apadrinar ahora
          </Link>
        </div>
      </div>
    </div>
  );
}
