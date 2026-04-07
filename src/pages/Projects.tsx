import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { FolderKanban, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type Profile = { user_id: string; full_name: string | null; email: string | null; hourly_rate: number };

type Project = {
  id: string;
  name: string;
  location: string;
  total_amount: number;
  expenses: number;
  start_date: string | null;
  end_date: string | null;
};

type AttendanceRecord = {
  user_id: string;
  project_id: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  break_duration_ms: number;
};

type Period = "all" | "weekly" | "monthly" | "yearly";

function getPeriodRange(period: Period): { start: string; end: string } | null {
  if (period === "all") return null;
  const now = new Date();
  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  } else if (period === "weekly") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  } else {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
}

export default function ProjectsPage() {
  const { role } = useAuth();
  const { t } = useTranslation();
  const isAdmin = role === "admin";

  const [projects, setProjects] = useState<Project[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [projectEmployees, setProjectEmployees] = useState<Record<string, string[]>>({});
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formExpenses, setFormExpenses] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formSelectedEmployees, setFormSelectedEmployees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);

    let attQuery = supabase.from("attendance_records").select("user_id, project_id, check_in_time, check_out_time, break_duration_ms").not("project_id", "is", null);
    const range = getPeriodRange(period);
    if (range) {
      attQuery = attQuery.gte("date", range.start).lte("date", range.end);
    }

    const [{ data: proj }, { data: pe }, { data: emp }, { data: att }] = await Promise.all([
      supabase.from("projects").select("*").order("created_at", { ascending: false }),
      supabase.from("project_employees").select("project_id, user_id"),
      supabase.from("profiles").select("user_id, full_name, email, hourly_rate"),
      attQuery,
    ]);

    setProjects((proj as Project[]) || []);
    const map: Record<string, string[]> = {};
    ((pe as any[]) || []).forEach((r: any) => {
      if (!map[r.project_id]) map[r.project_id] = [];
      map[r.project_id].push(r.user_id);
    });
    setProjectEmployees(map);
    setEmployees((emp as Profile[]) || []);
    setAttendance((att as AttendanceRecord[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [period]);

  // Calculate hours per project
  const projectStats = useMemo(() => {
    const rateMap = new Map(employees.map((e) => [e.user_id, e.hourly_rate || 0]));
    const stats: Record<string, { hours: number; wages: number }> = {};

    attendance.forEach((r) => {
      if (!r.project_id || !r.check_in_time || !r.check_out_time) return;
      const diff = new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime();
      const hours = Math.max(0, (diff - (r.break_duration_ms || 0)) / 3600000);
      if (!stats[r.project_id]) stats[r.project_id] = { hours: 0, wages: 0 };
      stats[r.project_id].hours += hours;
      stats[r.project_id].wages += hours * (rateMap.get(r.user_id) || 0);
    });

    return stats;
  }, [attendance, employees]);

  const filteredProjects = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter((p) => p.name.toLowerCase().includes(q) || p.location.toLowerCase().includes(q));
  }, [projects, searchQuery]);

  const openAdd = () => {
    setEditing(null);
    setFormName(""); setFormLocation(""); setFormAmount(""); setFormExpenses("");
    setFormStartDate(""); setFormEndDate(""); setFormSelectedEmployees([]);
    setModalOpen(true);
  };

  const openEdit = (proj: Project) => {
    setEditing(proj);
    setFormName(proj.name);
    setFormLocation(proj.location);
    setFormAmount(proj.total_amount.toString());
    setFormExpenses(proj.expenses.toString());
    setFormStartDate(proj.start_date || "");
    setFormEndDate(proj.end_date || "");
    setFormSelectedEmployees(projectEmployees[proj.id] || []);
    setModalOpen(true);
  };

  const toggleEmployee = (userId: string) => {
    setFormSelectedEmployees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!formName || !formLocation) {
      toast({ title: t("projects.nameLocationRequired"), variant: "destructive" });
      return;
    }
    if (!formStartDate || !formEndDate) {
      toast({ title: t("projects.datesRequired"), variant: "destructive" });
      return;
    }
    if (formStartDate > formEndDate) {
      toast({ title: t("projects.invalidDates"), variant: "destructive" });
      return;
    }

    // Check unique location
    const duplicate = projects.find((p) => p.location.toLowerCase() === formLocation.toLowerCase() && p.id !== editing?.id);
    if (duplicate) {
      toast({ title: t("projects.locationExists"), variant: "destructive" });
      return;
    }

    setSaving(true);
    const payload: any = {
      name: formName,
      location: formLocation,
      total_amount: parseFloat(formAmount) || 0,
      expenses: parseFloat(formExpenses) || 0,
      start_date: formStartDate || null,
      end_date: formEndDate || null,
    };

    let projectId: string | null = null;

    if (editing) {
      const { error } = await supabase.from("projects").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: t("projects.updateFailed"), description: error.message, variant: "destructive" });
        setSaving(false); return;
      }
      projectId = editing.id;
      toast({ title: t("projects.projectUpdated") });
    } else {
      const { data, error } = await supabase.from("projects").insert(payload).select("id").single();
      if (error || !data) {
        const desc = error?.message.includes("unique") ? t("projects.locationExists") : error?.message;
        toast({ title: t("projects.addFailed"), description: desc, variant: "destructive" });
        setSaving(false); return;
      }
      projectId = data.id;
      toast({ title: t("projects.projectAdded") });
    }

    // Sync employees
    if (projectId) {
      await supabase.from("project_employees").delete().eq("project_id", projectId);
      if (formSelectedEmployees.length > 0) {
        const rows = formSelectedEmployees.map((uid) => ({ project_id: projectId!, user_id: uid }));
        await supabase.from("project_employees").insert(rows);
      }
    }

    setSaving(false); setModalOpen(false); fetchData();
  };

  const handleDelete = async (proj: Project) => {
    if (!confirm(t("projects.deleteConfirm", { name: proj.name }))) return;
    const { error } = await supabase.from("projects").delete().eq("id", proj.id);
    toast(error
      ? { title: t("projects.deleteFailed"), description: error.message, variant: "destructive" }
      : { title: t("projects.projectDeleted") }
    );
    if (!error) fetchData();
  };

  const getEmployeeNames = (projId: string) => {
    const ids = projectEmployees[projId] || [];
    return ids.map((uid) => {
      const emp = employees.find((e) => e.user_id === uid);
      return emp?.full_name || emp?.email || uid.slice(0, 8);
    });
  };

  // Summary stats
  const totalRevenue = projects.reduce((s, p) => s + p.total_amount, 0);
  const totalExpenses = projects.reduce((s, p) => s + p.expenses, 0);
  const totalWages = Object.values(projectStats).reduce((s, v) => s + v.wages, 0);
  const totalProfit = totalRevenue - totalExpenses - totalWages;

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t("projects.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("projects.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input
            placeholder={t("projects.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[200px]"
          />
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("projects.allTime")}</SelectItem>
              <SelectItem value="weekly">{t("projects.weekly")}</SelectItem>
              <SelectItem value="monthly">{t("projects.monthly")}</SelectItem>
              <SelectItem value="yearly">{t("projects.yearly")}</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> {t("projects.addProject")}</Button>}
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard title={t("projects.totalRevenue")} value={`€${totalRevenue.toLocaleString()}`} icon={FolderKanban} variant="accent" />
          <StatCard title={t("projects.totalExpenses")} value={`€${totalExpenses.toLocaleString()}`} icon={FolderKanban} variant="warning" />
          <StatCard title={t("projects.totalWages")} value={`€${Math.round(totalWages).toLocaleString()}`} icon={FolderKanban} variant="default" />
          <StatCard title={t("projects.netProfit")} value={`€${Math.round(totalProfit).toLocaleString()}`} icon={FolderKanban} variant="success" />
        </div>
      )}

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">{t("loading")}</p>
        ) : filteredProjects.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            {t("projects.noProjects")} {isAdmin ? t("projects.noProjectsAdmin") : ""}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("projects.projectName")}</th>
                <th>{t("projects.projectLocation")}</th>
                <th>{t("projects.startDate")}</th>
                <th>{t("projects.endDate")}</th>
                <th>{t("projects.revenue")}</th>
                <th>{t("projects.expenses")}</th>
                <th>{t("projects.workerWages")}</th>
                <th>{t("projects.netProfit")}</th>
                <th>{t("projects.totalHours")}</th>
                <th>{t("projects.employeesCol")}</th>
                {isAdmin && <th>{t("actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((p) => {
                const stats = projectStats[p.id] || { hours: 0, wages: 0 };
                const netProfit = p.total_amount - p.expenses - stats.wages;
                const empNames = getEmployeeNames(p.id);
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-accent" />
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="text-muted-foreground">{p.location}</td>
                    <td className="text-muted-foreground">{p.start_date || "—"}</td>
                    <td className="text-muted-foreground">
                      {p.end_date ? (
                        <span className={new Date(p.end_date) < new Date(new Date().toISOString().split("T")[0]) ? "text-destructive font-medium" : ""}>
                          {p.end_date}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="mono">
                      <button
                        onClick={() => window.location.href = `/projects/${p.id}/revenues`}
                        className="underline hover:text-primary transition-colors"
                      >
                        €{p.total_amount.toLocaleString()}
                      </button>
                    </td>
                    <td className="mono">
                      <button
                        onClick={() => window.location.href = `/projects/${p.id}/expenses`}
                        className="underline hover:text-primary transition-colors"
                      >
                        €{p.expenses.toLocaleString()}
                      </button>
                    </td>
                    <td className="mono">€{Math.round(stats.wages).toLocaleString()}</td>
                    <td className={`mono font-medium ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                      €{Math.round(netProfit).toLocaleString()}
                    </td>
                    <td className="mono">{stats.hours.toFixed(1)}h</td>
                    <td>
                      {empNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {empNames.slice(0, 3).map((name, i) => (
                            <span key={i} className="inline-block text-xs bg-accent/20 text-accent-foreground rounded px-1.5 py-0.5">{name}</span>
                          ))}
                          {empNames.length > 3 && <span className="text-xs text-muted-foreground">+{empNames.length - 3}</span>}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("projects.editProject") : t("projects.addProject")}</DialogTitle>
            <DialogDescription>{editing ? t("projects.updateDetails") : t("projects.createProject")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("projects.projectName")} *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Office Renovation" />
            </div>
            <div className="space-y-2">
              <Label>{t("projects.projectLocation")} *</Label>
              <Input value={formLocation} onChange={(e) => setFormLocation(e.target.value)} placeholder="Amsterdam Central" />
            </div>
            {editing && (
              <div className="space-y-2">
                <Label>{t("projects.totalAmount")}</Label>
                <Input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("projects.startDate")} *</Label>
                <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>{t("projects.endDate")} *</Label>
                <Input
                  type="date"
                  value={formEndDate}
                  min={formStartDate || undefined}
                  onChange={(e) => setFormEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("projects.assignedEmployees")} ({formSelectedEmployees.length})</Label>
              <div className="border rounded-md">
                <ScrollArea className="h-40">
                  <div className="p-2 space-y-1">
                    {employees.map((emp) => (
                      <label key={emp.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/10 cursor-pointer text-sm">
                        <Checkbox
                          checked={formSelectedEmployees.includes(emp.user_id)}
                          onCheckedChange={() => toggleEmployee(emp.user_id)}
                        />
                        <span>{emp.full_name || emp.email || emp.user_id.slice(0, 8)}</span>
                      </label>
                    ))}
                    {employees.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">{t("employees.noEmployees")}</p>}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !formName || !formLocation}>
              {saving ? t("projects.saving") : editing ? t("save") : t("projects.addProject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
