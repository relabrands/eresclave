import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Entrar · Eres Clave" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) navigate({ to: "/dashboard" });
    });
    return unsub;
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
        toast.success("Cuenta creada. Bienvenido.");
        navigate({ to: "/dashboard" });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      const msg =
        err?.code === "auth/wrong-password" || err?.code === "auth/user-not-found"
          ? "Email o contraseña incorrectos."
          : err?.code === "auth/email-already-in-use"
          ? "Ese email ya está en uso."
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
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 mb-6">
            Eres Clave · Panel interno
          </p>
          <h1 className="text-4xl font-black leading-tight text-white">
            Gestiona campañas,<br />donaciones y más.
          </h1>
          <p className="mt-4 text-white/60 leading-relaxed text-sm max-w-sm">
            Desde aquí puedes administrar las campañas activas, registrar donaciones, agregar centros de acopio y más.
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

          <h2 className="text-3xl font-black text-foreground">
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Accede al panel de administración."
              : "Crea una cuenta para gestionar Eres Clave."}
          </p>

          <div className="mt-7 space-y-4">
            {mode === "signup" && (
              <div>
                <label className="text-sm font-semibold text-foreground">Nombre</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  required
                  className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                />
              </div>
            )}
            <div>
              <label className="text-sm font-semibold text-foreground">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
                className="mt-1.5 w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
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
            {mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>

          <p className="mt-5 text-sm text-center text-muted-foreground">
            {mode === "login" ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary font-semibold hover:underline"
            >
              {mode === "login" ? "Regístrate" : "Entra"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
