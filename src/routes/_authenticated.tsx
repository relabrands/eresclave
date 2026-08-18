import { createFileRoute, Outlet, Link, useNavigate, useRouterState, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LayoutDashboard, HandCoins, LogOut, Menu, X, ExternalLink, Users, Target, HeartHandshake } from "lucide-react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const user = auth.currentUser;
    const checkRole = async (u: User) => {
      const snap = await getDoc(doc(db, "users", u.uid));
      const role = snap.data()?.role;
      if (role !== "admin" && u.uid !== "FJpyhpWvp4hrM7xia5CsyjGcigB3" && u.uid !== "7EDbPJAUB6QxGjX3BBu6tRWH37g1") throw redirect({ to: "/auth" });
      
      // Auto-repair role if admin
      if ((u.uid === "FJpyhpWvp4hrM7xia5CsyjGcigB3" || u.uid === "7EDbPJAUB6QxGjX3BBu6tRWH37g1") && role !== "admin") {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "users", u.uid), { role: "admin", email: u.email }, { merge: true });
      }
    };
    if (!user) {
      await new Promise<void>((resolve) => {
        const unsub = onAuthStateChanged(auth, async (u) => {
          unsub();
          if (!u) throw redirect({ to: "/auth" });
          await checkRole(u);
          resolve();
        });
      });
    } else {
      await checkRole(user);
    }
  },
  component: DashboardLayout,
});

const nav = [
  { to: "/dashboard", label: "Resumen", Icon: LayoutDashboard, exact: true },
  { to: "/dashboard/campanas", label: "Campañas", Icon: Target },
  { to: "/dashboard/donaciones", label: "Donaciones", Icon: HandCoins },
  { to: "/dashboard/contactos", label: "Contactos", Icon: Users },
  { to: "/dashboard/voluntarios", label: "Voluntarios", Icon: HeartHandshake },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate({ to: "/auth" }); return; }
      const snap = await getDoc(doc(db, "users", u.uid));
      const role = snap.data()?.role;
      if (role !== "admin" && u.uid !== "FJpyhpWvp4hrM7xia5CsyjGcigB3" && u.uid !== "7EDbPJAUB6QxGjX3BBu6tRWH37g1") { await signOut(auth); navigate({ to: "/auth" }); return; }
      setUser(u);
    });
    return unsub;
  }, [navigate]);

  useEffect(() => setOpen(false), [pathname]);

  const logout = async () => {
    await signOut(auth);
    navigate({ to: "/auth" });
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  const displayName = user?.displayName || user?.email || "Admin";

  return (
    <div className="min-h-screen bg-secondary/30 flex" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-card border-r flex-col">
        <div className="h-16 px-5 flex items-center gap-3 border-b">
          <div className="h-8 w-8 rounded-lg bg-hero-gradient grid place-items-center text-white font-bold text-sm shrink-0">E</div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-none text-foreground truncate">Eres Clave</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Panel de administración</p>
          </div>
        </div>
        <nav className="p-3 flex-1 space-y-0.5">
          {nav.map(({ to, label, Icon, exact }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive(to, exact)
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-foreground/70 hover:bg-secondary hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" /> {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t space-y-0.5">
          <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-secondary transition-colors">
            <ExternalLink className="h-4 w-4" /> Ver sitio público
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-foreground/70 hover:bg-secondary transition-colors"
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
          <div className="px-3 pt-2 border-t border-border mt-1">
            <p className="text-[11px] text-muted-foreground truncate">{displayName}</p>
          </div>
        </div>
      </aside>

      {/* Mobile layout */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden h-14 px-4 flex items-center justify-between bg-card border-b">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-hero-gradient grid place-items-center text-white font-bold text-xs">E</div>
            <span className="font-semibold text-sm text-foreground">Eres Clave</span>
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="h-10 w-10 grid place-items-center rounded-lg hover:bg-secondary transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {open && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)}>
            <div className="absolute right-0 top-0 bottom-0 w-72 bg-card p-4 flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-foreground">Menú</span>
                <button onClick={() => setOpen(false)} className="h-9 w-9 grid place-items-center rounded-lg hover:bg-secondary">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5">
                {nav.map(({ to, label, Icon, exact }) => (
                  <Link
                    key={to}
                    to={to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                      isActive(to, exact) ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-foreground/70",
                    )}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </Link>
                ))}
              </nav>
              <div className="border-t pt-3 space-y-0.5">
                <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary text-foreground/70">
                  <ExternalLink className="h-4 w-4" /> Ver sitio
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-secondary text-foreground/70"
                >
                  <LogOut className="h-4 w-4" /> Cerrar sesión
                </button>
                <p className="px-3 pt-2 text-[11px] text-muted-foreground truncate border-t border-border mt-1">{displayName}</p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
