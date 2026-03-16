import { DashboardLayout } from "@/components/DashboardLayout";
import { Building2, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const companies = [
  { id: 1, name: "Acme Corporation", employees: 234, admins: 3, status: "active", created: "2024-01-15" },
  { id: 2, name: "TechFlow Inc", employees: 189, admins: 2, status: "active", created: "2024-02-20" },
  { id: 3, name: "BuildRight Co", employees: 156, admins: 2, status: "active", created: "2024-03-08" },
  { id: 4, name: "Global Logistics", employees: 312, admins: 4, status: "active", created: "2024-04-12" },
  { id: 5, name: "Fresh Foods Ltd", employees: 98, admins: 1, status: "active", created: "2024-05-01" },
];

export default function CompaniesPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Companies</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all registered companies</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1.5" /> Add Company
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Employees</th>
              <th>Admins</th>
              <th>Status</th>
              <th>Created</th>
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
                      <Building2 className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="mono">{c.employees}</td>
                <td className="mono">{c.admins}</td>
                <td>
                  <span className="status-badge status-active">Active</span>
                </td>
                <td className="mono text-muted-foreground">{c.created}</td>
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
