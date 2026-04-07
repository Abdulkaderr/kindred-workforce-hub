import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, Receipt } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type ProjectExpense = {
  id: string;
  project_id: string;
  invoice_reference: string;
  amount: number;
  expense_date: string;
  note: string | null;
  created_at: string;
};

type AttendanceRow = {
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  break_duration_ms: number;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  hourly_rate: number;
};

type Project = {
  id: string;
  name: string;
  location: string;
};

export default function ProjectExpensesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const isAdmin = role === "admin";

  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ProjectExpense | null>(null);
  const [formInvoice, setFormInvoice] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNote, setFormNote] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);

    const [projRes, expRes, attRes, profRes] = await Promise.all([
      supabase.from("projects").select("id, name, location").eq("id", projectId).single(),
      supabase.from("project_expenses").select("*").eq("project_id", projectId).order("expense_date", { ascending: false }),
      supabase.from("attendance_records").select("user_id, date, check_in_time, check_out_time, break_duration_ms").eq("project_id", projectId),
      supabase.from("profiles").select("user_id, full_name, email, hourly_rate"),
    ]);

    setProject(projRes.data as Project | null);
    setExpenses((expRes.data as ProjectExpense[]) || []);
    setAttendance((attRes.data as AttendanceRow[]) || []);
    setProfiles((profRes.data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const getName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || userId.slice(0, 8);
  };

  const getRate = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.hourly_rate || 0;
  };

  // Worker wages from attendance
  const wageRows = useMemo(() => {
    return attendance
      .filter((a) => a.check_in_time && a.check_out_time)
      .map((a) => {
        const diff = new Date(a.check_out_time!).getTime() - new Date(a.check_in_time!).getTime();
        const hours = Math.max(0, (diff - (a.break_duration_ms || 0)) / 3600000);
        const rate = getRate(a.user_id);
        return {
          name: getName(a.user_id),
          date: a.date,
          location: project?.location || "—",
          checkIn: new Date(a.check_in_time!).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          checkOut: new Date(a.check_out_time!).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          breakMins: Math.round((a.break_duration_ms || 0) / 60000),
          hours,
          salary: hours * rate,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, profiles, project]);

  const totalWages = wageRows.reduce((s, r) => s + r.salary, 0);
  const totalInvoiceExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const openAdd = () => {
    setEditing(null);
    setFormInvoice("");
    setFormAmount("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNote("");
    setModalOpen(true);
  };

  const openEdit = (exp: ProjectExpense) => {
    setEditing(exp);
    setFormInvoice(exp.invoice_reference);
    setFormAmount(exp.amount.toString());
    setFormDate(exp.expense_date);
    setFormNote(exp.note || "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formInvoice || !formAmount) {
      toast({ title: "Invoice reference and amount are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      project_id: projectId!,
      invoice_reference: formInvoice,
      amount: parseFloat(formAmount) || 0,
      expense_date: formDate,
      note: formNote || null,
    };

    if (editing) {
      const { error } = await supabase.from("project_expenses").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Expense updated" });
        // Update project total expenses
        await updateProjectExpenses();
        setModalOpen(false);
        fetchData();
      }
    } else {
      const { error } = await supabase.from("project_expenses").insert(payload);
      if (error) {
        toast({ title: "Failed to add expense", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Expense added" });
        await updateProjectExpenses();
        setModalOpen(false);
        fetchData();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (exp: ProjectExpense) => {
    if (!confirm(`Delete expense "${exp.invoice_reference}"?`)) return;
    const { error } = await supabase.from("project_expenses").delete().eq("id", exp.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Expense deleted" });
      await updateProjectExpenses();
      fetchData();
    }
  };

  const updateProjectExpenses = async () => {
    if (!projectId) return;
    const { data } = await supabase.from("project_expenses").select("amount").eq("project_id", projectId);
    const total = (data || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
    await supabase.from("projects").update({ expenses: total }).eq("id", projectId);
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="page-title">{project?.name || "Project"} — Expenses</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {project?.location || ""} · Worker Wages: €{Math.round(totalWages).toLocaleString()} · Invoice Expenses: €{totalInvoiceExpenses.toLocaleString()} · Total: €{(Math.round(totalWages) + totalInvoiceExpenses).toLocaleString()}
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> Add Expense</Button>
        )}
      </div>

      {/* Worker wages table */}
      <h2 className="text-lg font-semibold mb-3">Worker Wages</h2>
      <div className="rounded-md border bg-card shadow-sm overflow-x-auto mb-8">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : wageRows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No attendance records for this project.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Project Location</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Break</th>
                <th>Total Hours</th>
                <th>Total Salary</th>
              </tr>
            </thead>
            <tbody>
              {wageRows.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium">{r.name}</td>
                  <td className="mono">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td>{r.location}</td>
                  <td className="mono">{r.checkIn}</td>
                  <td className="mono">{r.checkOut}</td>
                  <td className="mono">{r.breakMins > 0 ? `${r.breakMins}m` : "—"}</td>
                  <td className="mono">{r.hours.toFixed(1)}</td>
                  <td className="mono">€{r.salary.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invoice expenses table */}
      <h2 className="text-lg font-semibold mb-3">Invoice Expenses</h2>
      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : expenses.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No invoice expenses yet.{isAdmin ? " Click 'Add Expense' to create one." : ""}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice Reference</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Note</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td className="font-medium flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                    {e.invoice_reference}
                  </td>
                  <td className="mono">€{e.amount.toLocaleString()}</td>
                  <td className="mono">{new Date(e.expense_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                  <td className="text-muted-foreground">{e.note || "—"}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(e)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Expense Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
            <DialogDescription>{editing ? "Update expense details" : "Add a new invoice expense"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice Reference *</Label>
              <Input value={formInvoice} onChange={(e) => setFormInvoice(e.target.value)} placeholder="INV-001" />
            </div>
            <div className="space-y-2">
              <Label>Amount (€) *</Label>
              <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Note (optional)</Label>
              <Textarea value={formNote} onChange={(e) => setFormNote(e.target.value)} placeholder="Description..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formInvoice || !formAmount}>
              {saving ? "Saving..." : editing ? "Save" : "Add Expense"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
