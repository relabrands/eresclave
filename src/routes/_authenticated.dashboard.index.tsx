import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { HandCoins, Users, TrendingUp, Target, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const [stats, setStats] = useState({
    campaigns: 0,
    donationsCount: 0,
    totalRaised: 0,
    loading: true
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const campsSnap = await getDocs(query(collection(db, "campaigns")));
        const dontsSnap = await getDocs(query(collection(db, "donations")));
        
        let total = 0;
        dontsSnap.forEach(d => total += (d.data().amount || 0));

        setStats({
          campaigns: campsSnap.size,
          donationsCount: dontsSnap.size,
          totalRaised: total,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
        setStats(s => ({ ...s, loading: false }));
      }
    };
    fetchData();
  }, []);

  if (stats.loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const cards = [
    { label: "Campañas totales", value: stats.campaigns, Icon: Target, accent: "text-blue-500" },
    { label: "Apadrinamientos", value: stats.donationsCount, Icon: Users, accent: "text-emerald-500" },
    { label: "Monto recaudado", value: `RD$ ${stats.totalRaised.toLocaleString()}`, Icon: TrendingUp, accent: "text-primary" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-foreground">Resumen General</h1>
        <p className="text-sm text-muted-foreground mt-1">El impacto de Eres Clave en números reales.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="bg-card rounded-2xl p-5 border shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-secondary/50">
                <c.Icon className={cn("h-5 w-5", c.accent)} />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{c.label}</p>
              <p className="text-3xl font-black text-foreground">{c.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
