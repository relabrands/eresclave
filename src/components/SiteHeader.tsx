import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Inicio" },
  { to: "/donar", label: "Donar útiles" },
  { to: "/iniciativa", label: "La iniciativa" },
];

export function SiteHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-300",
        scrolled
          ? "bg-background/90 backdrop-blur-md border-b shadow-soft"
          : "bg-transparent",
      )}
    >
      <div className="container-tight flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 min-w-0 group">
          <div className="h-10 w-10 shrink-0 rounded-xl bg-warm-gradient grid place-items-center text-white font-bold shadow-warm transition-transform group-hover:scale-105">
            <span className="font-display font-black text-lg">E</span>
          </div>
          <div className="leading-tight min-w-0">
            <p className="font-display font-black text-sm truncate">Eres Clave</p>
            <p className="text-[11px] text-muted-foreground -mt-0.5 flex items-center gap-1">
              <span>🇩🇴</span> Las Charcas
            </p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                pathname === n.to
                  ? "text-primary bg-secondary font-semibold"
                  : "text-foreground/65 hover:text-foreground hover:bg-secondary/70",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/auth"
            className="text-sm font-medium px-3 py-2 text-foreground/65 hover:text-foreground transition-colors"
          >
            Entrar
          </Link>
          <Link
            to="/donar"
            className="group inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl bg-warm-gradient text-white shadow-warm hover:shadow-glow hover:scale-105 transition-all duration-200"
          >
            <Heart className="h-4 w-4 group-hover:animate-pulse-heart" />
            Donar ahora
          </Link>
        </div>

      </div>
    </header>
  );
}
