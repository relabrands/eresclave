import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Heart, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Hide on dashboard and auth
  if (pathname.startsWith("/dashboard") || pathname === "/auth") return null;

  const links = [
    { to: "/", label: "Inicio", icon: Home },
    { to: "/iniciativa", label: "Iniciativa", icon: BookOpen },
    { to: "/donar", label: "Donar", icon: Heart },
    { to: "/auth", label: "Entrar", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {links.map((link) => {
          const isActive = pathname === link.to;
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full gap-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-[22px] w-[22px]", isActive && "fill-primary/20")} />
              <span className="text-[10px] font-semibold">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
