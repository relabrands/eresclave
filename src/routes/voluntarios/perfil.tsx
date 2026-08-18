import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, LogOut, Share2, Download, CheckCircle2,
  Loader2, Heart, Users, Calendar, Award, RotateCcw,
  Mail, Eye, EyeOff
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/voluntarios/perfil")({
  head: () => ({
    meta: [
      { title: "Mi Perfil de Voluntario · Eres Clave" },
      { name: "description", content: "Tu tarjeta de identidad digital como voluntario de la Fundación Eres Clave." },
    ],
  }),
  component: PerfilVoluntarioPage,
});

interface VolunteerData {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  type: "local" | "digital";
  city: string;
  whatsapp?: string;
  volunteerId: string;
  joinedAt: any;
  missions: string[];
  active: boolean;
}

function PerfilVoluntarioPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [volunteerData, setVolunteerData] = useState<VolunteerData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        const snap = await getDoc(doc(db, "volunteers", u.uid));
        if (snap.exists()) {
          setVolunteerData(snap.data() as VolunteerData);
        }
      }
    });
    return unsub;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError("Email o contraseña incorrectos.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    navigate({ to: "/" });
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    setIsFlipped(false); // ensure front is showing
    await new Promise(r => setTimeout(r, 400));
    try {
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        style: { transform: "none" }
      });
      const link = document.createElement("a");
      link.download = `eres-clave-voluntario-${volunteerData?.volunteerId?.replace("#", "") || "carnet"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (e) {
      console.error("Error generating image:", e);
    } finally {
      setDownloading(false);
    }
  };

  const shareCard = () => {
    if (navigator.share) {
      navigator.share({
        title: `${volunteerData?.name} · Voluntario Eres Clave`,
        text: `Soy voluntario ${volunteerData?.type === "local" ? "Local" : "Digital"} en la Fundación Eres Clave, Las Charcas. ¡Tú también puedes unirte!`,
        url: `${window.location.origin}/voluntarios`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/voluntarios`);
      alert("Link copiado. Compártelo con tus amigos!");
    }
  };

  const joinedDate = volunteerData?.joinedAt?.toDate
    ? volunteerData.joinedAt.toDate().toLocaleDateString("es-DO", { month: "long", year: "numeric" })
    : "2026";

  const joinedShort = volunteerData?.joinedAt?.toDate
    ? volunteerData.joinedAt.toDate().toLocaleDateString("es-DO", { month: "short", year: "numeric" }).toUpperCase()
    : "2026";

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center pb-20 md:pb-0">
          <div className="w-full max-w-sm mx-auto px-4">
            <div className="text-center mb-8">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-black text-foreground mb-2">Acceso a tu perfil</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Ingresa con la cuenta que usaste para registrarte como voluntario.
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
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
                    type={showPass ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-12 rounded-2xl border border-border bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {loginError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 bg-accent hover:opacity-90 disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-2xl transition-all"
              >
                {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {loginLoading ? "Entrando..." : "Acceder a mi perfil"}
              </button>
            </form>
            <Link to="/voluntarios/unirse" className="mt-6 inline-block text-sm text-center w-full text-primary hover:underline">
              ¿Aún no eres voluntario? Regístrate aquí
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }


  if (!volunteerData) {
    return (
      <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center pb-20 md:pb-0">
          <div className="text-center max-w-sm mx-auto px-4">
            <div className="text-5xl mb-6">📋</div>
            <h2 className="text-2xl font-black text-foreground mb-2">Aún no estás registrado</h2>
            <p className="text-muted-foreground mb-8">
              Hola {user.displayName}. Completa tu registro para acceder a tu tarjeta de voluntario.
            </p>
            <Link
              to="/voluntarios/unirse"
              className="inline-flex items-center gap-2 bg-accent text-white font-semibold px-6 py-3 rounded-full text-sm"
            >
              <Heart className="h-4 w-4" /> Completar registro
            </Link>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <SiteHeader />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="container-tight py-10 sm:py-14 max-w-4xl">
          {/* Nav */}
          <div className="flex items-center justify-between mb-10">
            <Link to="/voluntarios" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voluntarios
            </Link>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">
            {/* Left: profile info */}
            <div>
              {/* Header */}
              <div className="flex items-center gap-5 mb-8">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={volunteerData.name} className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20" />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                    {volunteerData.name.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h1 className="text-2xl font-black text-foreground">{volunteerData.name}</h1>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
                      {volunteerData.type === "local" ? "🏘️ Voluntario Local" : "💻 Voluntario Digital"}
                    </span>
                    <span className="text-xs text-muted-foreground">{volunteerData.volunteerId}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8">
                {[
                  { icon: <Calendar className="h-5 w-5 text-primary" />, label: "Miembro desde", value: joinedDate },
                  { icon: <Award className="h-5 w-5 text-primary" />, label: "Misiones", value: volunteerData.missions.length > 0 ? `${volunteerData.missions.length} completadas` : "0 completadas" },
                  { icon: <Users className="h-5 w-5 text-primary" />, label: "Frente", value: volunteerData.type === "local" ? "Local · Las Charcas" : `Digital · ${volunteerData.city}` },
                ].map((s, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-5">
                    <span className="block mb-3">{s.icon}</span>
                    <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                    <p className="text-sm font-bold text-foreground">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Missions section */}
              <div className="rounded-2xl border border-border bg-card p-6 mb-6">
                <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" /> Mis misiones
                </h2>
                {volunteerData.missions.length > 0 ? (
                  <div className="space-y-2">
                    {volunteerData.missions.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        {m}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">🚀</div>
                    <p className="text-sm text-muted-foreground">
                      Tus misiones aparecerán aquí cuando participes en campañas.
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      ¡El Operativo Médico de febrero es la primera!
                    </p>
                  </div>
                )}
              </div>

              {/* Share buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={shareCard}
                  className="inline-flex items-center gap-2 border border-border bg-card hover:bg-secondary text-foreground font-semibold px-5 py-3 rounded-full text-sm transition-all"
                >
                  <Share2 className="h-4 w-4" /> Compartir mi perfil
                </button>
                <button
                  onClick={downloadCard}
                  disabled={downloading}
                  className="inline-flex items-center gap-2 bg-accent hover:opacity-90 disabled:opacity-60 text-white font-semibold px-5 py-3 rounded-full text-sm transition-all"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Descargar carnet
                </button>
              </div>
            </div>

            {/* Right: flip card */}
            <div className="flex flex-col items-center gap-4">
              <p className="text-xs text-muted-foreground font-medium text-center">
                Toca para voltear la tarjeta ↻
              </p>

              {/* Flip card container */}
              <div
                className="cursor-pointer select-none"
                style={{ perspective: "1200px", width: "280px" }}
                onClick={() => setIsFlipped(!isFlipped)}
              >
                <div
                  style={{
                    width: "280px",
                    height: "460px",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1)",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                  }}
                >
                  {/* FRONT */}
                  <div
                    ref={cardRef}
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      WebkitBackfaceVisibility: "hidden",
                      borderRadius: "24px",
                      overflow: "hidden",
                      background: "linear-gradient(135deg, #0e2a26 0%, #1a4f47 100%)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      padding: "0",
                      boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                    }}
                  >
                    {/* Top bar */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "22px 24px 18px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)"
                    }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "2px" }}>
                          Fundación
                        </p>
                        <p style={{ color: "white", fontSize: "14px", fontWeight: 900, letterSpacing: "0.08em" }}>
                          ERES CLAVE
                        </p>
                      </div>
                      <div style={{
                        border: "1px solid rgba(232,93,4,0.5)",
                        borderRadius: "6px",
                        padding: "4px 10px"
                      }}>
                        <p style={{ color: "#e85d04", fontSize: "10px", fontWeight: 700, letterSpacing: "0.12em" }}>
                          {joinedShort}
                        </p>
                      </div>
                    </div>

                    {/* Photo */}
                    <div style={{ display: "flex", justifyContent: "center", paddingTop: "24px", paddingBottom: "0" }}>
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={volunteerData.name}
                          crossOrigin="anonymous"
                          style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(232,93,4,0.4)" }}
                        />
                      ) : (
                        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(232,93,4,0.2)", display: "flex", alignItems: "center", justifyContent: "center", border: "3px solid rgba(232,93,4,0.4)" }}>
                          <span style={{ color: "#e85d04", fontSize: "28px", fontWeight: 900 }}>
                            {volunteerData.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: "20px 24px 0" }}>
                      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "6px" }}>
                        {volunteerData.type === "local" ? "Voluntario Local" : "Voluntario Digital"}
                      </p>
                      <h3 style={{
                        color: "white",
                        fontSize: "22px",
                        fontWeight: 900,
                        lineHeight: 1.1,
                        marginBottom: "6px"
                      }}>
                        {volunteerData.name}
                      </h3>
                      <p style={{ color: "#e85d04", fontSize: "13px", fontWeight: 600, marginBottom: "0" }}>
                        {volunteerData.city}
                      </p>
                    </div>

                    {/* Bottom */}
                    <div style={{
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "space-between",
                      padding: "24px 24px 22px",
                      marginTop: "24px",
                      borderTop: "1px solid rgba(255,255,255,0.06)"
                    }}>
                      <div>
                        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "8px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "4px" }}>
                          ID Number
                        </p>
                        <p style={{ color: "white", fontFamily: "monospace", fontWeight: 700, fontSize: "14px" }}>
                          {volunteerData.volunteerId}
                        </p>
                      </div>
                      {/* QR placeholder */}
                      <div style={{
                        width: "56px", height: "56px", backgroundColor: "white",
                        borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px"
                      }}>
                        <svg viewBox="0 0 21 21" width="44" height="44" xmlns="http://www.w3.org/2000/svg">
                          <rect x="0" y="0" width="9" height="9" fill="none" stroke="#111" strokeWidth="1"/>
                          <rect x="1" y="1" width="7" height="7" fill="none" stroke="#111" strokeWidth="1"/>
                          <rect x="3" y="3" width="3" height="3" fill="#111"/>
                          <rect x="12" y="0" width="9" height="9" fill="none" stroke="#111" strokeWidth="1"/>
                          <rect x="13" y="1" width="7" height="7" fill="none" stroke="#111" strokeWidth="1"/>
                          <rect x="15" y="3" width="3" height="3" fill="#111"/>
                          <rect x="0" y="12" width="9" height="9" fill="none" stroke="#111" strokeWidth="1"/>
                          <rect x="1" y="13" width="7" height="7" fill="none" stroke="#111" strokeWidth="1"/>
                          <rect x="3" y="15" width="3" height="3" fill="#111"/>
                          <rect x="12" y="12" width="3" height="3" fill="#111"/>
                          <rect x="12" y="18" width="3" height="3" fill="#111"/>
                          <rect x="18" y="12" width="3" height="3" fill="#111"/>
                          <rect x="15" y="15" width="3" height="3" fill="#111"/>
                          <rect x="18" y="18" width="3" height="3" fill="#111"/>
                        </svg>
                      </div>
                    </div>

                    {/* Footer tip */}
                    <div style={{ padding: "0 24px 18px", textAlign: "center" }}>
                      <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "9px", letterSpacing: "0.1em" }}>
                        eresclave.org/voluntarios
                      </p>
                    </div>
                  </div>

                  {/* BACK */}
                  <div style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                    borderRadius: "24px",
                    overflow: "hidden",
                    background: "linear-gradient(135deg, #1a4f47 0%, #0e2a26 100%)",
                    border: "1px solid rgba(255,255,255,0.12)",
                    boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "32px 24px",
                    textAlign: "center",
                  }}>
                    <span style={{ fontSize: "48px", marginBottom: "20px" }}>🌟</span>
                    <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "12px" }}>
                      ERES CLAVE · LAS CHARCAS
                    </p>
                    <p style={{ color: "white", fontSize: "18px", fontWeight: 900, lineHeight: 1.3, marginBottom: "16px" }}>
                      "Cada mano que se suma<br/>mueve una comunidad."
                    </p>
                    <div style={{ width: "40px", height: "2px", background: "#e85d04", borderRadius: "2px", marginBottom: "20px" }} />
                    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", lineHeight: 1.6 }}>
                      {volunteerData.type === "local" ? "Voluntario Local" : "Voluntario Digital"}<br />
                      desde {joinedDate}
                    </p>
                    <div style={{ marginTop: "28px", padding: "10px 20px", border: "1px solid rgba(232,93,4,0.4)", borderRadius: "20px" }}>
                      <p style={{ color: "#e85d04", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em" }}>
                        {volunteerData.volunteerId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> {isFlipped ? "Ver frente" : "Voltear tarjeta"}
              </button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
