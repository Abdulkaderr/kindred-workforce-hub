import { DashboardLayout } from "@/components/DashboardLayout";
import { Plus, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const employees = [
  { id: 1, name: "Sarah Johnson", email: "sarah@acme.com", company: "Acme Corp", role: "Developer", rate: 45, status: "active" },
  { id: 2, name: "Mike Chen", email: "mike@acme.com", company: "Acme Corp", role: "Designer", rate: 40, status: "active" },
  { id: 3, name: "Lisa Park", email: "lisa@techflow.com", company: "TechFlow Inc", role: "Manager", rate: 55, status: "active" },
  { id: 4, name: "James Wilson", email: "james@buildright.com", company: "BuildRight Co", role: "Engineer", rate: 50, status: "active" },
  { id: 5, name: "Emma Davis", email: "emma@techflow.com", company: "TechFlow Inc", role: "Analyst", rate: 42, status: "active" },
  { id: 6, name: "Carlos Martinez", email: "carlos@acme.com", company: "Acme Corp", role: "Support", rate: 35, status: "inactive" },
];

export default function EmployeesPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage workforce across all companies</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1.5" /> Add Employee
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <div className="flex items-center gap-3 border-b px-5 py-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search employees..."
              className="h-8 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Role</th>
              <th>Hourly Rate</th>
              <th>Status</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {employees.map((e) => (
              <tr key={e.id}>
                <td className="font-medium">{e.name}</td>
                <td className="text-muted-foreground">{e.email}</td>
                <td>{e.company}</td>
                <td>{e.role}</td>
                <td className="mono">${e.rate}/hr</td>
                <td>
                  <span className={`status-badge ${e.status === "active" ? "status-active" : "status-absent"}`}>
                    {e.status === "active" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button className="rounded p-1 hover:bg-muted transition-colors">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
