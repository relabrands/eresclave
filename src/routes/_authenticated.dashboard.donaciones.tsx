import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, deleteDoc, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Plus, HandCoins, Trash2, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/donaciones")({
  component: DonacionesPage,
});

interface Campaign {
  id: string;
  title: string;
  goal: number;
}

interface Donation {
  id: string;
  campaignId: string;
  donorName: string;
  message: string;
  unitNumber: number; // e.g. backpack #1
  amount: number;
  isPaid: boolean;
  createdAt: any;
}

function DonacionesPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  // Form state
  const [campaignId, setCampaignId] = useState("");
  const [donorName, setDonorName] = useState("");
  const [message, setMessage] = useState("");
  const [unitNumber, setUnitNumber] = useState(1);
  const [amount, setAmount] = useState(450);
  const [isPaid, setIsPaid] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load campaigns
    getDocs(query(collection(db, "campaigns"))).then(snap => {
      const camps = snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign));
      setCampaigns(camps);
      if (camps.length > 0) setCampaignId(camps[0].id);
    });

    // Listen to donations
    const q = query(collection(db, "donations"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setDonations(snap.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
      setLoading(false);
    }, (err) => {
      console.error(err);
      toast.error("Error al cargar donaciones");
      setLoading(false);
    });
    return unsub;
  }, []);

  const openModal = () => {
    setDonorName("");
    setMessage("");
    setIsPaid(true);
    // Find next available unit for selected campaign
    const usedUnits = donations.filter(d => d.campaignId === campaignId).map(d => d.unitNumber);
    let next = 1;
    while(usedUnits.includes(next)) next++;
    setUnitNumber(next);
    
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignId) return toast.error("Selecciona una campaña");
    setSaving(true);
    try {
      // Check if unit is already taken
      const isTaken = donations.some(d => d.campaignId === campaignId && d.unitNumber === unitNumber);
      if (isTaken) {
        toast.error(`La mochila/unidad #${unitNumber} ya está apadrinada.`);
        setSaving(false);
        return;
      }

      await addDoc(collection(db, "donations"), {
        campaignId,
        donorName,
        message,
        unitNumber,
        amount,
        isPaid,
        createdAt: serverTimestamp()
      });
      toast.success("Apadrinamiento registrado");
      setModalOpen(false);
    } catch (err) {
      toast.error("Error al registrar donación");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este apadrinamiento? La mochila volverá a estar disponible.")) return;
    try {
      await deleteDoc(doc(db, "donations", id));
      toast.success("Registro eliminado");
    } catch (err) {
      toast.error("Error al eliminar");
    }
  };

  const filtered = donations.filter(d => 
    d.donorName.toLowerCase().includes(search.toLowerCase()) || 
    d.message.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Apadrinamientos</h1>
          <p className="text-sm text-muted-foreground mt-1">Registra los donantes para ir cubriendo el árbol.</p>
        </div>
        <button
          onClick={openModal}
          disabled={campaigns.length === 0}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-all disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Registrar apadrinamiento
        </button>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-xl border shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o mensaje..." 
          className="flex-1 bg-transparent text-sm px-2 py-1.5 focus:outline-none"
        />
        <button className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"><Filter className="h-4 w-4" /></button>
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <HandCoins className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">No hay registros</h3>
            <p className="text-sm text-muted-foreground mt-1">Aún no has registrado apadrinamientos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-4">Unidad</th>
                  <th className="px-6 py-4">Donante</th>
                  <th className="px-6 py-4 hidden md:table-cell">Campaña</th>
                  <th className="px-6 py-4">Monto</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(d => {
                  const camp = campaigns.find(c => c.id === d.campaignId);
                  return (
                    <tr key={d.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-primary whitespace-nowrap">
                        #{d.unitNumber}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-foreground">{d.donorName}</p>
                        {d.message && <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{d.message}</p>}
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                        {camp?.title || "—"}
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        RD$ {d.amount}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {d.isPaid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Pagado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg inline-flex">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Registrar apadrinamiento</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">Campaña</label>
                <select value={campaignId} onChange={e => {
                  setCampaignId(e.target.value);
                  // recalc next unit
                  const usedUnits = donations.filter(d => d.campaignId === e.target.value).map(d => d.unitNumber);
                  let next = 1;
                  while(usedUnits.includes(next)) next++;
                  setUnitNumber(next);
                }} required className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background">
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold">Asignar a Unidad #</label>
                  <input type="number" value={unitNumber} onChange={e => setUnitNumber(Number(e.target.value))} required min={1} className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-secondary/50 font-medium" />
                  <p className="text-[10px] text-muted-foreground mt-1">Ej. Mochila #2</p>
                </div>
                <div>
                  <label className="text-xs font-semibold">Monto (RD$)</label>
                  <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} required min={1} className="w-full px-3 py-2 text-sm rounded-lg border mt-1" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Nombre del donante</label>
                <input value={donorName} onChange={e => setDonorName(e.target.value)} required placeholder="Ej. Familia Rodríguez" className="w-full px-3 py-2 text-sm rounded-lg border mt-1" />
              </div>
              
              <div>
                <label className="text-xs font-semibold">Mensaje corto (opcional)</label>
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Ej. ¡Para un gran inicio!" maxLength={60} className="w-full px-3 py-2 text-sm rounded-lg border mt-1" />
              </div>

              <div className="flex items-center gap-2 pt-2 pb-1">
                <input 
                  type="checkbox" 
                  id="isPaid" 
                  checked={isPaid} 
                  onChange={e => setIsPaid(e.target.checked)} 
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isPaid" className="text-sm font-medium cursor-pointer select-none">
                  Marcar como pagado
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl flex justify-center items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
