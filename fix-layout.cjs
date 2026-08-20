const fs = require('fs');

const file = 'src/routes/voluntarios/perfil.tsx';
let content = fs.readFileSync(file, 'utf-8');

// The start of the main container
const startMarker = `          <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-start">`;
const endMarker = `        </div>\n      </main>`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find markers.");
  process.exit(1);
}

// We will replace everything between startIndex and endIndex with the new layout
const newLayout = `          <div className="flex flex-col items-center gap-8 sm:gap-10 mb-12">
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
              { icon: <Award className="h-5 w-5 text-primary" />, label: "Misiones", value: volunteerData.missions.length > 0 ? \`\${volunteerData.missions.length} completadas\` : "0 completadas" },
              { icon: <Users className="h-5 w-5 text-primary" />, label: "Frente", value: volunteerData.type === "local" ? "Local · Las Charcas" : \`Digital · \${volunteerData.city}\` },
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
                            {c.status === "active" ? "Campaña en curso" : "Próximamente"}
                          </p>
                        </div>
                        {!app ? (
                          <button
                            onClick={() => applyToMission(c.id, c.title)}
                            disabled={applying === c.id}
                            className="shrink-0 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            {applying === c.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Heart className="h-3 w-3" />}
                            Quiero ayudar
                          </button>
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
`;

const newContent = content.substring(0, startIndex) + newLayout + content.substring(endIndex);

fs.writeFileSync(file, newContent, 'utf-8');
console.log("Successfully replaced layout.");
