import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Loader2, Plus, Users, Trash2, Edit, Search, Phone, Mail, StickyNote, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/contactos")({
  component: ContactosPage,
});

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: any;
}

function ContactosPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const q = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setContacts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Contact)));
      setLoading(false);
    }, () => {
      toast.error("Error al cargar contactos");
      setLoading(false);
    });
    return unsub;
  }, []);

  const openNew = () => {
    setEditingId(null);
    setName(""); setPhone(""); setEmail(""); setNotes("");
    setModalOpen(true);
  };

  const openEdit = (c: Contact) => {
    setEditingId(c.id);
    setName(c.name); setPhone(c.phone || ""); setEmail(c.email || ""); setNotes(c.notes || "");
    setModalOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("El nombre es requerido");
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "contacts", editingId), { name: name.trim(), phone, email, notes });
        toast.success("Contacto actualizado");
      } else {
        await addDoc(collection(db, "contacts"), {
          name: name.trim(), phone, email, notes,
          createdAt: serverTimestamp()
        });
        toast.success("Contacto registrado");
      }
      setModalOpen(false);
    } catch {
      toast.error("Error al guardar contacto");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este contacto?")) return;
    try {
      await deleteDoc(doc(db, "contacts", id));
      toast.success("Contacto eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  };

  const filtered = contacts.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Contactos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registro de donantes y personas de contacto. {contacts.length} registrado(s).
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-all"
        >
          <Plus className="h-4 w-4" /> Nuevo contacto
        </button>
      </div>

      <div className="flex items-center gap-2 bg-card p-2 rounded-xl border shadow-sm">
        <Search className="h-4 w-4 text-muted-foreground ml-2 shrink-0" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email..."
          className="flex-1 bg-transparent text-sm px-2 py-1.5 focus:outline-none"
        />
        {search && (
          <button onClick={() => setSearch("")} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground">
              {search ? "Sin resultados" : "Sin contactos"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Intenta otra búsqueda." : "Agrega tu primer contacto/donante."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors">
                {/* Avatar */}
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-base flex-shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{c.name}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                    {c.phone && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {c.email}
                      </span>
                    )}
                    {c.notes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <StickyNote className="h-3 w-3" /> {c.notes}
                      </span>
                    )}
                  </div>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 text-muted-foreground hover:bg-secondary rounded-lg">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">{editingId ? "Editar contacto" : "Nuevo contacto"}</h2>
              <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold">Nombre completo *</label>
                <input value={name} onChange={e => setName(e.target.value)} required placeholder="Ej. Familia Rodríguez" className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold">Teléfono (Opcional)</label>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="809-555-5555" className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Email (Opcional)</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ejemplo.com" className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">Notas internas (Opcional)</label>
                <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ej. Llamar después de las 5pm" className="w-full px-3 py-2 text-sm rounded-lg border mt-1 bg-background" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-secondary">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-xl flex justify-center items-center gap-2">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editingId ? "Guardar" : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
