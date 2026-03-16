import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search, Plus, Pencil, Trash2, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type EmployeeRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  hourly_rate: number;
  role: string;
};

export default function EmployeesPage() {
  const { role } = useAuth();
  const { t } = useTranslation();
  const isAdmin = role === "admin";
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"employee" | "admin">("employee");
  const [addRate, setAddRate] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"employee" | "admin">("employee");
  const [editRate, setEditRate] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwEmployee, setPwEmployee] = useState<EmployeeRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const fetchEmployees = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, hourly_rate"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roles = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]));
    const merged = (profilesRes.data || []).map((p: any) => ({
      ...p,
      hourly_rate: Number(p.hourly_rate) || 0,
      role: roles.get(p.user_id) || "employee",
    }));

    setEmployees(merged);
    setLoading(false);
  };

  useEffect(() => { fetchEmployees(); }, []);

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (e.full_name || "").toLowerCase().includes(s) || (e.email || "").toLowerCase().includes(s) || e.role.toLowerCase().includes(s);
  });

  const handleAddEmployee = async () => {
    if (!addEmail || !addPassword || !addName) return;
    setAddLoading(true);
    const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-users", {
      body: { action: "create_user", email: addEmail, password: addPassword, full_name: addName, hourly_rate: Number(addRate) || 0 },
    });
    if (fnError || fnData?.error) {
      toast({ title: t("employees.addFailed"), description: fnData?.error || fnError?.message, variant: "destructive" });
      setAddLoading(false);
      return;
    }
    if (fnData?.user) {
      if (addRole === "admin") {
        await supabase.from("user_roles").update({ role: "admin" as any }).eq("user_id", fnData.user.id);
      }
      if (Number(addRate) > 0) {
        await supabase.from("profiles").update({ hourly_rate: Number(addRate) } as any).eq("user_id", fnData.user.id);
      }
    }
    toast({ title: t("employees.employeeAdded"), description: t("employees.employeeAddedDesc", { name: addName }) });
    setAddOpen(false); setAddEmail(""); setAddName(""); setAddPassword(""); setAddRole("employee"); setAddRate(""); setAddLoading(false);
    fetchEmployees();
  };

  const handleEditEmployee = async () => {
    if (!editEmployee) return;
    setEditLoading(true);
    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").update({ full_name: editName, hourly_rate: Number(editRate) || 0 } as any).eq("user_id", editEmployee.user_id),
      supabase.from("user_roles").update({ role: editRole as any }).eq("user_id", editEmployee.user_id),
    ]);
    if (profileRes.error || roleRes.error) {
      toast({ title: t("employees.updateFailed"), description: profileRes.error?.message || roleRes.error?.message, variant: "destructive" });
    } else {
      toast({ title: t("employees.employeeUpdated") });
    }
    setEditOpen(false); setEditLoading(false); fetchEmployees();
  };

  const handleDeleteEmployee = async (emp: EmployeeRow) => {
    if (!confirm(t("employees.confirmDelete", { name: emp.full_name || emp.email }))) return;
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "delete_user", user_id: emp.user_id } });
    if (error || data?.error) {
      toast({ title: t("employees.deleteFailed"), description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: t("employees.employeeRemoved") }); fetchEmployees();
    }
  };

  const openEdit = (emp: EmployeeRow) => {
    setEditEmployee(emp); setEditName(emp.full_name || ""); setEditRole(emp.role as "employee" | "admin"); setEditRate(String(emp.hourly_rate || 0)); setEditOpen(true);
  };

  const openChangePassword = (emp: EmployeeRow) => { setPwEmployee(emp); setNewPassword(""); setPwOpen(true); };

  const handleChangePassword = async () => {
    if (!pwEmployee || !newPassword) return;
    setPwLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users", { body: { action: "change_password", user_id: pwEmployee.user_id, password: newPassword } });
    if (error || data?.error) {
      toast({ title: t("employees.passwordFailed"), description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: t("employees.passwordUpdated") });
    }
    setPwLoading(false); setPwOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t("employees.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("employees.subtitle")}</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> {t("employees.addEmployee")}
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        <div className="flex items-center gap-3 border-b px-5 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input type="text" placeholder={t("employees.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-accent" />
          </div>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">{t("loading")}</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">{t("employees.noEmployees")}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("employees.name")}</th>
                <th>{t("employees.email")}</th>
                <th>{t("employees.rate")}</th>
                <th>{t("employees.role")}</th>
                {isAdmin && <th>{t("actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.user_id}>
                  <td className="font-medium">{e.full_name || "—"}</td>
                  <td className="text-muted-foreground">{e.email || "—"}</td>
                  <td className="mono">${e.hourly_rate}/hr</td>
                  <td>
                    <span className={`status-badge ${e.role === "admin" ? "status-active" : "status-completed"}`}>
                      {e.role.charAt(0).toUpperCase() + e.role.slice(1)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" onClick={() => openChangePassword(e)}><Key className="h-3.5 w-3.5" /></Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEmployee(e)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("employees.addEmployee")}</DialogTitle>
            <DialogDescription>{t("employees.createAccount")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("employees.fullName")}</Label><Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="John Doe" /></div>
            <div className="space-y-2"><Label>{t("employees.email")}</Label><Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="john@company.com" /></div>
            <div className="space-y-2"><Label>{t("employees.password")}</Label><Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Min 6 characters" /></div>
            <div className="space-y-2"><Label>{t("employees.hourlyRate")}</Label><Input type="number" min="0" step="0.01" value={addRate} onChange={(e) => setAddRate(e.target.value)} placeholder="25.00" /></div>
            <div className="space-y-2">
              <Label>{t("employees.role")}</Label>
              <Select value={addRole} onValueChange={(v) => setAddRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleAddEmployee} disabled={addLoading || !addEmail || !addName || !addPassword}>
              {addLoading ? t("employees.adding") : t("employees.addEmployee")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("employees.editEmployee")}</DialogTitle>
            <DialogDescription>{t("employees.updateDetails")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("employees.fullName")}</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-2"><Label>{t("employees.hourlyRate")}</Label><Input type="number" min="0" step="0.01" value={editRate} onChange={(e) => setEditRate(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>{t("employees.role")}</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleEditEmployee} disabled={editLoading}>{editLoading ? t("employees.saving") : t("employees.saveChanges")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("employees.changePassword")}</DialogTitle>
            <DialogDescription>{t("employees.setNewPassword", { name: pwEmployee?.full_name || pwEmployee?.email })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("employees.newPassword")}</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleChangePassword} disabled={pwLoading || newPassword.length < 6}>{pwLoading ? t("employees.updating") : t("employees.updatePassword")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
