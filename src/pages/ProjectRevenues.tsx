import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type ProjectRevenue = {
  id: string;
  project_id: string;
  title: string;
  amount: number;
  revenue_date: string;
  note: string | null;
  created_at: string;
};

type Project = {
  id: string;
  name: string;
  location: string;
  total_amount: number;
};

export default function ProjectRevenuesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [project, setProject] = useState<Project | null>(null);
  const [revenues, setRevenues] = useState<ProjectRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectRevenue | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNote, setFormNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);
    const [projRes, revRes] = await Promise.all([
      supabase.from("projects").select("id, name, location, total_amount").eq("id", projectId).single(),
      supabase.from("project_revenues").select("*").eq("project_id", projectId).order("revenue_date", { ascending: false }),
    ]);
    setProject(projRes.data as Project | null);
    setRevenues((revRes.data as ProjectRevenue[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const totalRevenue = revenues.reduce((s, r) => s + r.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setFormTitle("");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNote("");
    setModalOpen(true);
  };

  const openEdit = (rev: ProjectRevenue) => {
    setEditing(rev);
    setFormTitle(rev.title);
    setFormAmount(rev.amount.toString());
    setFormDate(rev.revenue_date);
    setFormNote(rev.note || "");
    setModalOpen(true);
  };

  const updateProjectTotalAmount = async () => {
    if (!projectId) return;
    const { data } = await supabase.from("project_revenues").select("amount").eq("project_id", projectId);
    const total = (data || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
    await supabase.from("projects").update({ total_amount: total }).eq("id", projectId);
  };

  const handleSave = async () => {
    if (!formTitle || !formAmount) {
      toast({ title: "Titel en bedrag zijn verplicht", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      project_id: projectId!,
      title: formTitle,
      amount: parseFloat(formAmount) || 0,
      revenue_date: formDate,
      note: formNote || null,
    };

    if (editing) {
      const { error } = await supabase.from("project_revenues").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Bijwerken mislukt", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Omzet bijgewerkt" });
        await updateProjectTotalAmount();
        setModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from("project_revenues").insert(payload);
      if (error) {
        toast({ title: "Toevoegen mislukt", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Omzet toegevoegd" });
        await updateProjectTotalAmount();
        setModalOpen(false);
        fetchData();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (rev: ProjectRevenue) => {
    if (!confirm(`"${rev.title}" verwijderen?`)) return;
    const { error } = await supabase.from("project_revenues").delete().eq("id", rev.id);
    if (error) {
      toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Omzet verwijderd" });
      await updateProjectTotalAmount();
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <div>
            <h1 className="page-title">{project?.name || "Project"} — Omzet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Totale omzet: €{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> Omzet Toevoegen</Button>
        )}
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Laden...</p>
        ) : revenues.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            Nog geen omzet.{isAdmin ? " Klik op 'Omzet Toevoegen' om te beginnen." : ""}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Titel</th>
                <th>Bedrag</th>
                <th>Datum</th>
                <th>Notitie</th>
                {isAdmin && <th>Acties</th>}
              </tr>
            </thead>
            <tbody>
              {revenues.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    {r.title}
                  </td>
                  <td className="mono">€{r.amount.toLocaleString()}</td>
                  <td className="mono">{new Date(r.revenue_date).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })}</td>
                  <td className="text-muted-foreground">{r.note || "—"}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(r)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Omzet Bewerken" : "Omzet Toevoegen"}</DialogTitle>
            <DialogDescription>{editing ? "Werk de omzet details bij" : "Voeg een nieuw omzet item toe"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel *</Label>
              <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Extra werkzaamheden" />
            </div>
            <div className="space-y-2">
              <Label>Bedrag (€) *</Label>
              <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Datum</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notitie (optioneel)</Label>
              <Textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="Beschrijving..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={saving || !formTitle || !formAmount}>
              {saving ? "Opslaan..." : editing ? "Opslaan" : "Toevoegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
