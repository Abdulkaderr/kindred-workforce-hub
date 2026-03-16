import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { FileText, Download, Users, Clock, DollarSign, CalendarDays } from "lucide-react";

const attendanceSummary = [
  { employee: "Sarah Johnson", company: "Acme Corp", daysWorked: 22, totalHours: "176.5", avgHours: "8.0", lateCount: 1, absentCount: 0 },
  { employee: "Mike Chen", company: "Acme Corp", daysWorked: 21, totalHours: "168.0", avgHours: "8.0", lateCount: 2, absentCount: 1 },
  { employee: "Lisa Park", company: "TechFlow Inc", daysWorked: 23, totalHours: "184.0", avgHours: "8.0", lateCount: 0, absentCount: 0 },
  { employee: "James Wilson", company: "BuildRight Co", daysWorked: 19, totalHours: "152.0", avgHours: "8.0", lateCount: 4, absentCount: 3 },
  { employee: "Emma Davis", company: "TechFlow Inc", daysWorked: 22, totalHours: "172.0", avgHours: "7.8", lateCount: 1, absentCount: 0 },
];

const payrollSummary = [
  { employee: "Sarah Johnson", company: "Acme Corp", totalHours: "176.5", rate: 45, totalSalary: 7942.5, paidAmount: 7942.5, remaining: 0, status: "paid" },
  { employee: "Mike Chen", company: "Acme Corp", totalHours: "168.0", rate: 40, totalSalary: 6720, paidAmount: 6720, remaining: 0, status: "paid" },
  { employee: "Lisa Park", company: "TechFlow Inc", totalHours: "184.0", rate: 55, totalSalary: 10120, paidAmount: 5060, remaining: 5060, status: "partial" },
  { employee: "James Wilson", company: "BuildRight Co", totalHours: "152.0", rate: 50, totalSalary: 7600, paidAmount: 0, remaining: 7600, status: "unpaid" },
  { employee: "Emma Davis", company: "TechFlow Inc", totalHours: "172.0", rate: 42, totalSalary: 7224, paidAmount: 7224, remaining: 0, status: "paid" },
];

export default function ReportsPage() {
  const totalEmployees = attendanceSummary.length;
  const totalHoursWorked = attendanceSummary.reduce((sum, e) => sum + parseFloat(e.totalHours), 0);
  const totalDaysWorked = attendanceSummary.reduce((sum, e) => sum + e.daysWorked, 0);
  const totalPayroll = payrollSummary.reduce((sum, e) => sum + e.totalSalary, 0);
  const totalPaid = payrollSummary.reduce((sum, e) => sum + e.paidAmount, 0);
  const totalRemaining = payrollSummary.reduce((sum, e) => sum + e.remaining, 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Attendance & payroll reports with export options</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} variant="accent" />
        <StatCard title="Total Hours Worked" value={totalHoursWorked.toFixed(1)} icon={Clock} variant="default" />
        <StatCard title="Total Days Worked" value={totalDaysWorked} icon={CalendarDays} variant="success" />
        <StatCard title="Total Payroll" value={`$${totalPayroll.toLocaleString()}`} icon={DollarSign} variant="warning" />
      </div>

      {/* Attendance Summary */}
      <div className="rounded-md border bg-card shadow-sm mb-6">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Attendance Summary
          </h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Days Worked</th>
              <th>Total Hours</th>
              <th>Avg Hours/Day</th>
              <th>Late Count</th>
              <th>Absent Count</th>
            </tr>
          </thead>
          <tbody>
            {attendanceSummary.map((e, i) => (
              <tr key={i}>
                <td className="font-medium">{e.employee}</td>
                <td className="text-muted-foreground">{e.company}</td>
                <td className="mono">{e.daysWorked}</td>
                <td className="mono">{e.totalHours}</td>
                <td className="mono">{e.avgHours}</td>
                <td className="mono">{e.lateCount > 0 ? <span className="text-warning">{e.lateCount}</span> : "0"}</td>
                <td className="mono">{e.absentCount > 0 ? <span className="text-destructive">{e.absentCount}</span> : "0"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payroll Summary */}
      <div className="rounded-md border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            Payroll Summary
          </h2>
          <div className="flex gap-3 text-xs">
            <span className="text-muted-foreground">Total Paid: <span className="font-semibold text-success">${totalPaid.toLocaleString()}</span></span>
            <span className="text-muted-foreground">Remaining: <span className="font-semibold text-warning">${totalRemaining.toLocaleString()}</span></span>
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Total Hours</th>
              <th>Rate</th>
              <th>Total Salary</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payrollSummary.map((e, i) => (
              <tr key={i}>
                <td className="font-medium">{e.employee}</td>
                <td className="text-muted-foreground">{e.company}</td>
                <td className="mono">{e.totalHours}</td>
                <td className="mono">${e.rate}/hr</td>
                <td className="mono font-medium">${e.totalSalary.toLocaleString()}</td>
                <td className="mono text-success">${e.paidAmount.toLocaleString()}</td>
                <td className="mono">{e.remaining > 0 ? <span className="text-warning">${e.remaining.toLocaleString()}</span> : "$0"}</td>
                <td>
                  <span className={`status-badge ${e.status === "paid" ? "status-completed" : e.status === "partial" ? "status-pending" : "status-absent"}`}>
                    {e.status.charAt(0).toUpperCase() + e.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
