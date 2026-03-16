import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const payroll = [
  { employee: "Sarah Johnson", company: "Acme Corp", totalHours: 176.5, paidHours: 176.5, remainingHours: 0, rate: 45, totalSalary: 7942.5, paidAmount: 7942.5, remainingAmount: 0, status: "paid" },
  { employee: "Mike Chen", company: "Acme Corp", totalHours: 168.0, paidHours: 168.0, remainingHours: 0, rate: 40, totalSalary: 6720, paidAmount: 6720, remainingAmount: 0, status: "paid" },
  { employee: "Lisa Park", company: "TechFlow Inc", totalHours: 184.0, paidHours: 92.0, remainingHours: 92.0, rate: 55, totalSalary: 10120, paidAmount: 5060, remainingAmount: 5060, status: "partial" },
  { employee: "James Wilson", company: "BuildRight Co", totalHours: 152.0, paidHours: 0, remainingHours: 152.0, rate: 50, totalSalary: 7600, paidAmount: 0, remainingAmount: 7600, status: "pending" },
  { employee: "Emma Davis", company: "TechFlow Inc", totalHours: 172.0, paidHours: 172.0, remainingHours: 0, rate: 42, totalSalary: 7224, paidAmount: 7224, remainingAmount: 0, status: "paid" },
];

const totalSalary = payroll.reduce((s, p) => s + p.totalSalary, 0);
const totalPaid = payroll.reduce((s, p) => s + p.paidAmount, 0);
const totalRemaining = payroll.reduce((s, p) => s + p.remainingAmount, 0);

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
        <StatCard title="Total Payroll" value={`$${totalSalary.toLocaleString()}`} icon={DollarSign} variant="default" />
        <StatCard title="Total Paid" value={`$${totalPaid.toLocaleString()}`} icon={CheckCircle} variant="success" />
        <StatCard title="Remaining" value={`$${totalRemaining.toLocaleString()}`} icon={Clock} variant="warning" />
        <StatCard title="Overdue" value="$0" icon={AlertTriangle} variant="default" />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Total Hours</th>
              <th>Paid Hours</th>
              <th>Remaining Hours</th>
              <th>Rate</th>
              <th>Total Salary</th>
              <th>Paid Amount</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((p, i) => (
              <tr key={i}>
                <td className="font-medium">{p.employee}</td>
                <td className="text-muted-foreground">{p.company}</td>
                <td className="mono">{p.totalHours.toFixed(1)}</td>
                <td className="mono text-success">{p.paidHours.toFixed(1)}</td>
                <td className="mono">{p.remainingHours > 0 ? <span className="text-warning">{p.remainingHours.toFixed(1)}</span> : "0.0"}</td>
                <td className="mono">${p.rate}/hr</td>
                <td className="mono font-medium">${p.totalSalary.toLocaleString()}</td>
                <td className="mono text-success">${p.paidAmount.toLocaleString()}</td>
                <td className="mono">{p.remainingAmount > 0 ? <span className="text-warning">${p.remainingAmount.toLocaleString()}</span> : "$0"}</td>
                <td>
                  <span className={`status-badge ${p.status === "paid" ? "status-completed" : p.status === "partial" ? "status-pending" : "status-late"}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
                <td>
                  {p.status !== "paid" ? (
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
