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

type EmployeeRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

export default function EmployeesPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Add employee modal
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"employee" | "admin">("employee");
  const [addLoading, setAddLoading] = useState(false);

  // Edit employee modal
  const [editOpen, setEditOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<EmployeeRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<"employee" | "admin">("employee");
  const [editLoading, setEditLoading] = useState(false);

  // Change password modal
  const [pwOpen, setPwOpen] = useState(false);
  const [pwEmployee, setPwEmployee] = useState<EmployeeRow | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const fetchEmployees = async () => {
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roles = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]));
    const merged = (profilesRes.data || []).map((p: any) => ({
      ...p,
      role: roles.get(p.user_id) || "employee",
    }));

    setEmployees(merged);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = employees.filter((e) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (e.full_name || "").toLowerCase().includes(s) ||
      (e.email || "").toLowerCase().includes(s) ||
      e.role.toLowerCase().includes(s)
    );
  });

  const handleAddEmployee = async () => {
    if (!addEmail || !addPassword || !addName) return;
    setAddLoading(true);

    const { data: fnData, error: fnError } = await supabase.functions.invoke("admin-users", {
      body: { action: "create_user", email: addEmail, password: addPassword, full_name: addName },
    });

    if (fnError || fnData?.error) {
      toast({ title: "Failed to add employee", description: fnData?.error || fnError?.message, variant: "destructive" });
      setAddLoading(false);
      return;
    }

    // Update role if admin
    if (fnData?.user && addRole === "admin") {
      await supabase.from("user_roles").update({ role: "admin" as any }).eq("user_id", fnData.user.id);
    }

    toast({ title: "Employee added", description: `${addName} has been added successfully.` });
    setAddOpen(false);
    setAddEmail("");
    setAddName("");
    setAddPassword("");
    setAddRole("employee");
    setAddLoading(false);
    fetchEmployees();
  };

  const handleEditEmployee = async () => {
    if (!editEmployee) return;
    setEditLoading(true);

    const [profileRes, roleRes] = await Promise.all([
      supabase.from("profiles").update({ full_name: editName }).eq("user_id", editEmployee.user_id),
      supabase.from("user_roles").update({ role: editRole as any }).eq("user_id", editEmployee.user_id),
    ]);

    if (profileRes.error || roleRes.error) {
      toast({ title: "Update failed", description: profileRes.error?.message || roleRes.error?.message, variant: "destructive" });
    } else {
      toast({ title: "Employee updated" });
    }

    setEditOpen(false);
    setEditLoading(false);
    fetchEmployees();
  };

  const handleDeleteEmployee = async (emp: EmployeeRow) => {
    if (!confirm(`Are you sure you want to remove ${emp.full_name || emp.email}?`)) return;

    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "delete_user", user_id: emp.user_id },
    });

    if (error || data?.error) {
      toast({ title: "Delete failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Employee removed" });
      fetchEmployees();
    }
  };

  const openEdit = (emp: EmployeeRow) => {
    setEditEmployee(emp);
    setEditName(emp.full_name || "");
    setEditRole(emp.role as "employee" | "admin");
    setEditOpen(true);
  };

  const openChangePassword = (emp: EmployeeRow) => {
    setPwEmployee(emp);
    setNewPassword("");
    setPwOpen(true);
  };

  const handleChangePassword = async () => {
    if (!pwEmployee || !newPassword) return;
    setPwLoading(true);

    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "change_password", user_id: pwEmployee.user_id, password: newPassword },
    });

    if (error || data?.error) {
      toast({ title: "Password change failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated" });
    }
    setPwLoading(false);
    setPwOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all registered employees</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Employee
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        <div className="flex items-center gap-3 border-b px-5 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No employees found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.user_id}>
                  <td className="font-medium">{e.full_name || "—"}</td>
                  <td className="text-muted-foreground">{e.email || "—"}</td>
                  <td>
                    <span className={`status-badge ${e.role === "admin" ? "status-active" : "status-completed"}`}>
                      {e.role.charAt(0).toUpperCase() + e.role.slice(1)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(e)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openChangePassword(e)}>
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDeleteEmployee(e)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Employee Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Create a new employee account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="john@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={addPassword} onChange={(e) => setAddPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
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
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddEmployee} disabled={addLoading || !addEmail || !addName || !addPassword}>
              {addLoading ? "Adding..." : "Add Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
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
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditEmployee} disabled={editLoading}>
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a new password for {pwEmployee?.full_name || pwEmployee?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={handleChangePassword} disabled={pwLoading || newPassword.length < 6}>
              {pwLoading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
