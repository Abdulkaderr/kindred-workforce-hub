import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const payroll = [
  { employee: "Sarah Johnson", company: "Acme Corp", hours: "168.5", rate: 45, total: 7582.5, status: "paid" },
  { employee: "Mike Chen", company: "Acme Corp", hours: "160.0", rate: 40, total: 6400, status: "paid" },
  { employee: "Lisa Park", company: "TechFlow Inc", hours: "172.0", rate: 55, total: 9460, status: "pending" },
  { employee: "James Wilson", company: "BuildRight Co", hours: "155.5", rate: 50, total: 7775, status: "pending" },
  { employee: "Emma Davis", company: "TechFlow Inc", hours: "164.0", rate: 42, total: 6888, status: "paid" },
];

export default function PayrollPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Monthly payroll management</p>
        </div>
        <Button>Generate Payroll</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Payroll" value="$284,500" icon={DollarSign} variant="default" />
        <StatCard title="Paid" value="$198,200" icon={CheckCircle} variant="success" />
        <StatCard title="Pending" value="$86,300" icon={Clock} variant="warning" />
        <StatCard title="Overdue" value="$0" icon={AlertTriangle} variant="default" />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Hours Worked</th>
              <th>Hourly Rate</th>
              <th>Total Salary</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((p, i) => (
              <tr key={i}>
                <td className="font-medium">{p.employee}</td>
                <td className="text-muted-foreground">{p.company}</td>
                <td className="mono">{p.hours}</td>
                <td className="mono">${p.rate}/hr</td>
                <td className="mono font-medium">${p.total.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${p.status === "paid" ? "status-completed" : "status-pending"}`}>
                    {p.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </td>
                <td>
                  {p.status === "pending" ? (
                    <Button size="sm" variant="outline">
                      Confirm Payment
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
