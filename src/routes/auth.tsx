import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft, ShieldCheck } from "lucide-react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, getDocs, collection, query, where, setDoc } from "firebase/firestore";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar · Panel Admin · Eres Clave" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in as admin, redirect to dashboard
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        let userRole: string | undefined;
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          userRole = snap.data()?.role;
        }
        if (userRole !== "admin" && user.email) {
          const q = query(collection(db, "users"), where("email", "==", user.email));
          const querySnap = await getDocs(q);
          for (const d of querySnap.docs) {
            if (d.data()?.role === "admin") {
              userRole = "admin";
              break;
            }
          }
        }
        if (userRole === "admin") {
          navigate({ to: "/dashboard" });
        }
      } catch (err) {
        console.error("Auth check error:", err);
      }
    });
    return unsub;
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      let userRole: string | undefined;

      // 1. Direct document lookup by UID
      try {
        const snap = await getDoc(doc(db, "users", cred.user.uid));
        if (snap.exists()) {
          userRole = snap.data()?.role;
        }
      } catch (err) {
        console.error("Error reading doc by UID:", err);
      }

      // 2. Query by email in users collection if not found
      if (userRole !== "admin" && cred.user.email) {
        try {
          const q = query(collection(db, "users"), where("email", "==", cred.user.email));
          const querySnap = await getDocs(q);
          for (const d of querySnap.docs) {
            if (d.data()?.role === "admin") {
              userRole = "admin";
              // Synchronize UID document in Firestore
              await setDoc(doc(db, "users", cred.user.uid), {
                email: cred.user.email,
                role: "admin",
              }, { merge: true });
              break;
            }
          }
        } catch (err) {
          console.error("Error querying user by email:", err);
        }
      }

      if (userRole !== "admin") {
        await auth.signOut();
        toast.error("Acceso denegado. Esta cuenta no tiene permisos de administrador en Firestore.");
        return;
      }

      navigate({ to: "/dashboard" });
    } catch (err: any) {
      const msg =
        err?.code === "auth/wrong-password" || err?.code === "auth/user-not-found" || err?.code === "auth/invalid-credential"
          ? "Email o contraseña incorrectos."
          : err?.message || "Error al autenticar";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Left — brand panel */}
      <div className="hidden lg:flex bg-hero-gradient text-white p-12 flex-col justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-white/75 hover:text-white text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Volver al sitio
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-5 w-5 text-white/50" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              Eres Clave · Panel de administración
            </p>
          </div>
          <h1 className="text-4xl font-black leading-tight text-white">
            Gestiona campañas,<br />donaciones y más.
          </h1>
          <p className="mt-4 text-white/60 leading-relaxed text-sm max-w-sm">
            Desde aquí puedes administrar las campañas activas, registrar donaciones, gestionar contactos y mucho más.
          </p>
        </div>
        <p className="text-xs text-white/30">© Eres Clave · Las Charcas, Azua</p>
      </div>

      {/* Right — form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-sm">
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 text-sm text-muted-foreground mb-8 hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver al inicio
          </Link>

          <div className="h-12 w-12 rounded-2xl bg-hero-gradient grid place-items-center mb-6">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>

          <h2 className="text-3xl font-black text-foreground">Acceso Admin</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Panel de administración de la Fundación Eres Clave.
          </p>

          <div className="mt-7 space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                autoComplete="email"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña"
                required
                autoComplete="current-password"
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-60 hover:opacity-90 transition-all active:scale-[0.98]"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Entrar al panel
          </button>

          <div className="mt-8 p-4 rounded-2xl bg-secondary/60 border border-border">
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Este panel es exclusivo para administradores de la fundación.<br />
              <Link to="/voluntarios" className="text-primary hover:underline font-medium">
                ¿Eres voluntario? Accede desde aquí →
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
