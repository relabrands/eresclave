import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft, LogOut, Share2, Download, CheckCircle2,
  Loader2, Heart, Users, Calendar, Award, RotateCcw,
  Mail, Eye, EyeOff, Target
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { cn } from "@/lib/utils";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot, setDoc, serverTimestamp, collectionGroup } from "firebase/firestore";
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

interface Campaign {
  id: string;
  title: string;
  slug: string;
  status: "active" | "completed" | "upcoming";
  type: "backpacks" | "medical";
  eventDate?: string;
}

interface Application {
  id: string;
  campaignId: string;
  campaignTitle: string;
  status: "pending" | "approved" | "completed" | "rejected";
  assignedRole?: string;
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

  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        const snap = await getDoc(doc(db, "volunteers", u.uid));
        if (snap.exists()) {
          setVolunteerData(snap.data() as VolunteerData);
        } else {
          await signOut(auth);
        }
      }
    });

    if (!user) return unsub;

    const qCamps = query(collection(db, "campaigns"), where("status", "in", ["active", "upcoming"]));
    const unsubCamps = onSnapshot(qCamps, (snap) => {
      setActiveCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
    });

    const qApps = query(collectionGroup(db, "applications"), where("volunteerId", "==", user.uid));
    const unsubApps = onSnapshot(qApps, (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() } as Application)));
    });

    return () => {
      unsub();
      unsubCamps();
      unsubApps();
    };
  }, [user]);

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

  const handleLogout = async () => {
    await signOut(auth);
    navigate({ to: "/voluntarios" });
  };

  const applyToMission = async (campaignId: string, campaignTitle: string) => {
    if (!user || !volunteerData) return;
    setApplying(campaignId);
    try {
      await setDoc(doc(db, "campaigns", campaignId, "applications", user.uid), {
        volunteerId: user.uid,
        volunteerName: volunteerData.name,
        volunteerType: volunteerData.type,
        city: volunteerData.city,
        campaignId,
        campaignTitle,
        status: "pending",
        appliedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
      alert("Error al enviar solicitud. Intenta de nuevo.");
    } finally {
      setApplying(null);
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

          <div className="flex flex-col items-center gap-8 sm:gap-10 mb-12">
            {/* Top Text */}
            <div className="text-center space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">Credencial Oficial</p>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">{volunteerData.name}</h1>
              <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse inline-block" />
                  {volunteerData.type === "local" ? "Local" : "Digital"}
                </span>
                <span>ID: {volunteerData.volunteerId}</span>
              </p>
            </div>

            {/* Flip card container */}
            <div className="flex flex-col items-center gap-4">
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
                      background: "linear-gradient(135deg, #004A45 0%, #006E66 100%)",
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
                          Impulso Comunitario
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
                    <div style={{ display: "flex", justifyItems: "center", paddingTop: "24px", paddingBottom: "0", marginLeft: "auto", marginRight: "auto", width: "72px" }}>
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
                      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "6px" }}>
                        Yo soy {volunteerData.type === "local" ? "voluntario en" : "voluntario por"}
                      </p>
                      <h3 style={{
                        color: "white",
                        fontSize: "22px",
                        fontWeight: 900,
                        lineHeight: 1.1,
                        marginBottom: "6px"
                      }}>
                        {volunteerData.type === "local" ? volunteerData.city : "Las Charcas"}
                      </h3>
                      <p style={{ color: "#e85d04", fontSize: "14px", fontWeight: 700, marginBottom: "0" }}>
                        {volunteerData.name}
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
                    background: "linear-gradient(135deg, #006E66 0%, #004A45 100%)",
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

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm mt-2">
                <button
                  onClick={shareCard}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 border border-border bg-card hover:bg-secondary text-foreground font-bold px-5 py-3.5 rounded-2xl text-xs sm:text-sm shadow-xs transition-all active:scale-[0.98]"
                >
                  <Share2 className="h-4 w-4 text-primary" /> Compartir
                </button>
                <button
                  onClick={downloadCard}
                  disabled={downloading}
                  className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 bg-accent hover:opacity-90 disabled:opacity-60 text-white font-bold px-5 py-3.5 rounded-2xl text-xs sm:text-sm shadow-warm transition-all active:scale-[0.98]"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Descargar
                </button>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: <Calendar className="h-5 w-5 text-primary" />, label: "Miembro desde", value: joinedDate },
              { icon: <Award className="h-5 w-5 text-primary" />, label: "Misiones", value: volunteerData.missions.length > 0 ? `${volunteerData.missions.length} completadas` : "0 completadas" },
              { icon: <Users className="h-5 w-5 text-primary" />, label: "Frente", value: volunteerData.type === "local" ? "Local · Las Charcas" : `Digital · ${volunteerData.city}` },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-5">
                <span className="block mb-3">{s.icon}</span>
                <p className="text-xs text-muted-foreground mb-1 font-medium">{s.label}</p>
                <p className="text-sm font-bold text-foreground">{s.value}</p>
              </div>
            ))}
          </div>

          {activeCampaigns.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6 mb-6">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" /> Misiones Activas Disponibles
              </h2>
              <div className="space-y-3">
                {activeCampaigns.map(c => {
                  const app = applications.find(a => a.campaignId === c.id);
                  return (
                    <div key={c.id} className="border rounded-xl p-4 bg-background">
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="font-semibold text-sm">{c.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {c.status === "active" ? "Campaña en curso" : c.status === "completed" ? "Campaña concluida" : "Próximamente"}
                          </p>
                        </div>
                        {!app ? (
                          c.status === "completed" ? (
                            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground bg-secondary px-3 py-1.5 rounded-lg border border-border">
                              Concluida
                            </span>
                          ) : (
                            <button
                              onClick={() => applyToMission(c.id, c.title)}
                              disabled={applying === c.id}
                              className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {applying === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Heart className="h-3 w-3" />}
                              Quiero ayudar
                            </button>
                          )
                        ) : (
                          <span className={cn(
                            "shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full",
                            app.status === "pending" ? "bg-orange-100 text-orange-700" :
                            app.status === "approved" ? "bg-emerald-100 text-emerald-700" :
                            app.status === "completed" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                          )}>
                            {app.status === "pending" ? "En revisión" :
                             app.status === "approved" ? "Aprobado" :
                             app.status === "completed" ? "Completada" : "Rechazada"}
                          </span>
                        )}
                      </div>
                      {app?.assignedRole && app.status === "approved" && (
                        <div className="mt-3 text-xs bg-secondary/50 p-2 rounded-lg flex items-center gap-2 border">
                          <span className="font-medium">Tu rol asignado:</span>
                          <span className="text-primary font-bold">{app.assignedRole}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-6 mb-6">
            <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Historial de Misiones
            </h2>
            {volunteerData.missions.length > 0 ? (
              <div className="space-y-2">
                {volunteerData.missions.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-foreground bg-secondary/40 p-3 rounded-xl">
                    <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                    <span className="font-medium">{m}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-3xl mb-2">🚀</div>
                <p className="text-sm text-muted-foreground font-medium">
                  Aún no tienes misiones registradas.
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  ¡Postúlate a las misiones activas de arriba para participar!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
