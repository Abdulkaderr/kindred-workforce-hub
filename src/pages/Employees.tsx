import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type EmployeeRow = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);

      const roles = new Map((rolesRes.data || []).map((r) => [r.user_id, r.role]));
      const merged = (profilesRes.data || []).map((p) => ({
        ...p,
        role: roles.get(p.user_id) || "employee",
      }));

      setEmployees(merged);
      setLoading(false);
    };

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

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all registered employees</p>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
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
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
