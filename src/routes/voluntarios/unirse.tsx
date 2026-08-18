import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff,
  MapPin, Heart, ChevronRight, User, AlertCircle
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  onAuthStateChanged, updateProfile, type User as FirebaseUser
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp,
  collection, getDocs, orderBy, query, limit
} from "firebase/firestore";

export const Route = createFileRoute("/voluntarios/unirse")({
  head: () => ({
    meta: [
      { title: "Registrarme como Voluntario · Eres Clave" },
      { name: "description", content: "Únete al Escuadrón Eres Clave. Regístrate en menos de 2 minutos." },
    ],
  }),
  component: UnirseVoluntarioPage,
});

type Track = "local" | "digital" | null;
type FormStep = "account" | "profile";

function UnirseVoluntarioPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Account fields
  const [step, setStep] = useState<FormStep>("account");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading2, setAuthLoading2] = useState(false);

  // Profile fields
  const [track, setTrack] = useState<Track>(null);
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        const snap = await getDoc(doc(db, "volunteers", u.uid));
        if (snap.exists()) setAlreadyRegistered(true);
        else setStep("profile"); // logged in but not yet registered
      }
    });
    return unsub;
  }, []);

  const handleAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading2(true);
    setError(null);
    try {
      if (authMode === "signup") {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        // Verify it's a volunteer role, not admin trying to use volunteer form
        const snap = await getDoc(doc(db, "volunteers", cred.user.uid));
        if (!snap.exists()) {
          // New user logging in — let them complete profile
          setStep("profile");
          return;
        }
        const data = snap.data();
        if (data?.active) {
          setAlreadyRegistered(true);
          return;
        }
      }
      // account created / logged in → go to profile step
      setStep("profile");
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") setError("Ese email ya tiene una cuenta. Usa 'Entrar' en vez de registrarte.");
      else if (code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-credential") setError("Email o contraseña incorrectos.");
      else if (code === "auth/weak-password") setError("La contraseña debe tener al menos 6 caracteres.");
      else setError(err?.message || "Error al autenticar. Intenta de nuevo.");
    } finally {
      setAuthLoading2(false);
    }
  };

  const generateVolunteerId = async (): Promise<string> => {
    const q = query(collection(db, "volunteers"), orderBy("joinedAt", "asc"), limit(1000));
    const snap = await getDocs(q).catch(() => ({ size: 0 }));
    const count = (snap.size || 0) + 1;
    return `#EC-${String(count).padStart(3, "0")}`;
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !track) return;
    if (!city.trim()) { setError("Por favor escribe tu ciudad o comunidad."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const volunteerId = await generateVolunteerId();
      const u = auth.currentUser;
      // Save to volunteers collection (volunteer data)
      await setDoc(doc(db, "volunteers", u.uid), {
        uid: u.uid,
        name: u.displayName || name,
        email: u.email,
        type: track,
        city: city.trim(),
        whatsapp: whatsapp.trim(),
        motivation: motivation.trim(),
        volunteerId,
        joinedAt: serverTimestamp(),
        active: true,
        missions: [],
        role: "volunteer",
      });
      // Also save role in users collection (consistent with admin pattern)
      await setDoc(doc(db, "users", u.uid), {
        uid: u.uid,
        email: u.email,
        role: "volunteer",
        name: u.displayName || name,
      }, { merge: true });
      setSubmitted(true);
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
          <Link
            to="/voluntarios"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al programa de voluntariado
          </Link>

          {/* Header */}
          <div className="mb-10">
            <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Escuadrón Eres Clave
            </span>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
              {step === "account" ? "Crea tu cuenta de voluntario." : "Cuéntanos sobre ti."}
            </h1>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              {step === "account"
                ? "Necesitas una cuenta para acceder a tu carnet digital y perfil de voluntario."
                : "Elige tu frente y completa tu perfil. Ya casi eres parte del Escuadrón."}
            </p>
          </div>

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { num: "01", label: "Tu cuenta" },
              { num: "02", label: "Tu perfil" },
            ].map((s, i) => {
              const isCurrent = (step === "account" && i === 0) || (step === "profile" && i === 1);
              const isDone = step === "profile" && i === 0;
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all",
                    isDone ? "bg-primary text-white" : isCurrent ? "bg-primary/15 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                  </div>
                  <span className={cn("text-xs font-medium", isCurrent ? "text-foreground" : "text-muted-foreground")}>{s.label}</span>
                  {i === 0 && <div className="w-8 h-px bg-border mx-1" />}
                </div>
              );
            })}
          </div>

          {/* ── Already registered ── */}
          {alreadyRegistered ? (
            <div className="rounded-3xl border border-primary/20 bg-card p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-xl font-black text-foreground mb-2">¡Ya eres parte del Escuadrón!</h2>
              <p className="text-muted-foreground mb-6">
                {user?.displayName || user?.email} — tu registro ya está completo.
              </p>
              <Link
                to="/voluntarios/perfil"
                className="inline-flex items-center gap-2 bg-accent hover:opacity-90 text-white font-semibold px-6 py-3 rounded-full text-sm transition-all"
              >
                Ver mi perfil <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : step === "account" ? (
            /* ── STEP 1: ACCOUNT ── */
            <form onSubmit={handleAccountSubmit} className="rounded-3xl border border-border bg-card p-8 space-y-5">
              {/* Mode switcher */}
              <div className="flex rounded-2xl border border-border overflow-hidden">
                {(["signup", "login"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setAuthMode(m); setError(null); }}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-semibold transition-all",
                      authMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "signup" ? "Crear cuenta" : "Ya tengo cuenta"}
                  </button>
                ))}
              </div>

              {authMode === "signup" && (
                <div>
                  <label className="block text-sm font-bold text-foreground mb-1.5">Nombre completo</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre completo"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    minLength={6}
                    autoComplete={authMode === "signup" ? "new-password" : "current-password"}
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading2}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:opacity-90 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
              >
                {authLoading2 ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {authMode === "signup" ? "Creando cuenta..." : "Entrando..."}</>
                ) : (
                  <>{authMode === "signup" ? "Crear mi cuenta" : "Entrar"} <ChevronRight className="h-4 w-4" /></>
                )}
              </button>

              <p className="text-xs text-center text-muted-foreground">
                Tu cuenta será usada para acceder a tu carnet de voluntario y perfil en Eres Clave.
              </p>
            </form>
          ) : (
            /* ── STEP 2: PROFILE ── */
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* User badge */}
              <div className="rounded-2xl border border-border bg-card p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {(user?.displayName || user?.email || "V").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{user?.displayName || "Voluntario"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <span className="text-xs text-primary font-medium bg-primary/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                  ✓ Cuenta creada
                </span>
              </div>

              {/* Track selection */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-3">
                  ¿Cuál es tu frente? <span className="text-red-500">*</span>
                </label>
                <div className="grid sm:grid-cols-2 gap-4">
                  {([
                    { id: "local", emoji: "🏘️", title: "Voluntario Local", desc: "Estoy en Las Charcas y puedo apoyar en el campo." },
                    { id: "digital", emoji: "💻", title: "Voluntario Digital", desc: "Estoy en SD, el Cibao, el exterior o cualquier otro lugar." },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTrack(t.id)}
                      className={cn(
                        "rounded-2xl border-2 p-5 text-left transition-all hover:-translate-y-0.5",
                        track === t.id ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"
                      )}
                    >
                      <div className="text-3xl mb-3">{t.emoji}</div>
                      <p className="font-bold text-foreground text-sm">{t.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.desc}</p>
                      {track === t.id && <CheckCircle2 className="h-4 w-4 text-primary mt-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">
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
                <label className="block text-sm font-bold text-foreground mb-1.5">
                  WhatsApp <span className="text-muted-foreground font-normal">(opcional)</span>
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
                <label className="block text-sm font-bold text-foreground mb-1.5">
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
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !track}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-[0.98]"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Guardando...</>
                ) : (
                  <><Heart className="h-4 w-4" /> Unirme al Escuadrón</>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
