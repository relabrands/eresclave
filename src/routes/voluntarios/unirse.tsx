import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Loader2, LogIn,
  MapPin, Globe, Heart, ChevronRight, User
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider, signInWithPopup, onAuthStateChanged, type User as FirebaseUser
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp, collection, getDocs, query, orderBy, limit
} from "firebase/firestore";

export const Route = createFileRoute("/voluntarios/unirse")({
  head: () => ({
    meta: [
      { title: "Registrarme como Voluntario · Eres Clave" },
      { name: "description", content: "Únete al Escuadrón Eres Clave. Regístrate como voluntario local o digital en menos de 2 minutos." },
    ],
  }),
  component: UnirseVoluntarioPage,
});

type Track = "local" | "digital" | null;

function UnirseVoluntarioPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [track, setTrack] = useState<Track>(null);
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        // Check if already registered
        const docRef = doc(db, "volunteers", u.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setAlreadyRegistered(true);
        }
      }
    });
    return unsub;
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    }
  };

  const generateVolunteerId = async (): Promise<string> => {
    const q = query(collection(db, "volunteers"), orderBy("joinedAt", "asc"), limit(1000));
    const snap = await getDocs(q);
    const count = snap.size + 1;
    return `#EC-${String(count).padStart(3, "0")}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !track) return;
    if (!city.trim()) { setError("Por favor escribe tu ciudad o comunidad."); return; }

    setSubmitting(true);
    setError(null);
    try {
      const volunteerId = await generateVolunteerId();
      await setDoc(doc(db, "volunteers", user.uid), {
        uid: user.uid,
        name: user.displayName || "Voluntario",
        email: user.email,
        photoURL: user.photoURL,
        type: track,
        city: city.trim(),
        whatsapp: whatsapp.trim(),
        motivation: motivation.trim(),
        volunteerId,
        joinedAt: serverTimestamp(),
        active: true,
        missions: [],
      });
      setSubmitted(true);
      // Redirect to profile after 1.5s
      setTimeout(() => navigate({ to: "/voluntarios/perfil" }), 1500);
    } catch (e: any) {
      setError("Ocurrió un error al guardar tu registro. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-sm mx-auto px-4">
          <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4 animate-bounce" />
          <h2 className="text-2xl font-black text-foreground mb-2">¡Bienvenido al Escuadrón!</h2>
          <p className="text-muted-foreground mb-1">Tu registro fue exitoso.</p>
          <p className="text-sm text-muted-foreground">Redirigiendo a tu perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container-tight py-12 sm:py-16 max-w-2xl">
          {/* Back */}
          <Link
            to="/voluntarios"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al programa de voluntariado
          </Link>

          <div className="mb-10">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Escuadrón Eres Clave
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              Únete en 2 minutos.
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Solo necesitas una cuenta de Google y elegir tu frente. Sin formularios largos, sin requisitos.
            </p>
          </div>

          {!user ? (
            /* ─── SIGN IN STEP ─── */
            <div className="rounded-3xl border border-border bg-card p-8">
              <h2 className="text-lg font-bold text-foreground mb-2">Paso 1 · Inicia sesión</h2>
              <p className="text-sm text-muted-foreground mb-8">
                Usamos Google para crear tu perfil automáticamente con tu nombre y foto.
                No guardamos contraseñas ni compartimos tu info.
              </p>

              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border border-border hover:bg-gray-50 text-gray-800 font-semibold py-4 px-6 rounded-2xl transition-all hover:-translate-y-0.5 hover:shadow-soft"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar con Google
              </button>

              {error && (
                <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
              )}

              <div className="mt-6 flex items-start gap-3 p-4 rounded-2xl bg-secondary/60">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Solo usamos tu cuenta de Google para crear tu perfil de voluntario en Eres Clave.
                  No publicamos nada en tu nombre ni tenemos acceso a tu correo.
                </p>
              </div>
            </div>
          ) : alreadyRegistered ? (
            /* ─── ALREADY REGISTERED ─── */
            <div className="rounded-3xl border border-primary/20 bg-card p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-black text-foreground mb-2">¡Ya eres parte del Escuadrón!</h2>
              <p className="text-muted-foreground mb-6">
                Hola, {user.displayName}. Tu registro ya está completo.
              </p>
              <Link
                to="/voluntarios/perfil"
                className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-all"
              >
                Ver mi perfil <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            /* ─── REGISTRATION FORM ─── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User info display */}
              <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || ""} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <span className="text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                  ✓ Conectado
                </span>
              </div>

              {/* Track selection */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  Paso 2 · ¿Cuál es tu frente? <span className="text-red-500">*</span>
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTrack("local")}
                    className={cn(
                      "rounded-2xl border-2 p-5 text-left transition-all hover:-translate-y-0.5",
                      track === "local"
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="text-3xl mb-3">🏘️</div>
                    <p className="font-bold text-foreground text-sm">Voluntario Local</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Estoy en Las Charcas y puedo apoyar en el campo.
                    </p>
                    {track === "local" && (
                      <CheckCircle2 className="h-4 w-4 text-primary mt-3" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTrack("digital")}
                    className={cn(
                      "rounded-2xl border-2 p-5 text-left transition-all hover:-translate-y-0.5",
                      track === "digital"
                        ? "border-primary bg-primary/5 shadow-soft"
                        : "border-border bg-card hover:border-primary/40"
                    )}
                  >
                    <div className="text-3xl mb-3">💻</div>
                    <p className="font-bold text-foreground text-sm">Voluntario Digital</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Estoy en SD, el Cibao, el exterior o cualquier otro lugar.
                    </p>
                    {track === "digital" && (
                      <CheckCircle2 className="h-4 w-4 text-primary mt-3" />
                    )}
                  </button>
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  {track === "local" ? "Tu comunidad / barrio" : "Tu ciudad / país"} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder={track === "local" ? "Las Charcas, Azua" : "Santo Domingo / Nueva York"}
                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    required
                  />
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  WhatsApp <span className="text-muted-foreground font-normal">(opcional, para coordinación)</span>
                </label>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+1 (809) 000-0000"
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              {/* Motivation */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">
                  ¿Por qué quieres ser voluntario? <span className="text-muted-foreground font-normal">(opcional)</span>
                </label>
                <textarea
                  value={motivation}
                  onChange={(e) => setMotivation(e.target.value)}
                  placeholder="Cuéntanos un poco sobre lo que te motivó a unirte..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting || !track}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Heart className="h-4 w-4" /> Registrarme en el Escuadrón</>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Al registrarte, aceptas ser contactado por el equipo de Eres Clave para actividades de voluntariado.
              </p>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
