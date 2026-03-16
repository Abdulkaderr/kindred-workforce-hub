import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Users, Clock, DollarSign, CalendarDays, CheckCircle } from "lucide-react";

type Period = "weekly" | "monthly" | "yearly";

const attendanceData = {
  weekly: [
    { employee: "Sarah Johnson", daysWorked: 5, totalHours: "42.0", avgHours: "8.4", lateCount: 0, absentCount: 0 },
    { employee: "Mike Chen", daysWorked: 5, totalHours: "40.0", avgHours: "8.0", lateCount: 1, absentCount: 0 },
    { employee: "Lisa Park", daysWorked: 5, totalHours: "44.0", avgHours: "8.8", lateCount: 0, absentCount: 0 },
    { employee: "James Wilson", daysWorked: 4, totalHours: "38.0", avgHours: "9.5", lateCount: 2, absentCount: 1 },
    { employee: "Emma Davis", daysWorked: 5, totalHours: "41.0", avgHours: "8.2", lateCount: 0, absentCount: 0 },
  ],
  monthly: [
    { employee: "Sarah Johnson", daysWorked: 22, totalHours: "176.5", avgHours: "8.0", lateCount: 1, absentCount: 0 },
    { employee: "Mike Chen", daysWorked: 21, totalHours: "168.0", avgHours: "8.0", lateCount: 2, absentCount: 1 },
    { employee: "Lisa Park", daysWorked: 23, totalHours: "184.0", avgHours: "8.0", lateCount: 0, absentCount: 0 },
    { employee: "James Wilson", daysWorked: 19, totalHours: "152.0", avgHours: "8.0", lateCount: 4, absentCount: 3 },
    { employee: "Emma Davis", daysWorked: 22, totalHours: "172.0", avgHours: "7.8", lateCount: 1, absentCount: 0 },
  ],
  yearly: [
    { employee: "Sarah Johnson", daysWorked: 260, totalHours: "2100.0", avgHours: "8.1", lateCount: 8, absentCount: 3 },
    { employee: "Mike Chen", daysWorked: 252, totalHours: "2016.0", avgHours: "8.0", lateCount: 15, absentCount: 8 },
    { employee: "Lisa Park", daysWorked: 264, totalHours: "2208.0", avgHours: "8.4", lateCount: 2, absentCount: 1 },
    { employee: "James Wilson", daysWorked: 228, totalHours: "1824.0", avgHours: "8.0", lateCount: 30, absentCount: 24 },
    { employee: "Emma Davis", daysWorked: 258, totalHours: "2064.0", avgHours: "8.0", lateCount: 6, absentCount: 2 },
  ],
};

const payrollData = {
  weekly: [
    { employee: "Sarah Johnson", totalHours: "42.0", rate: 45, totalSalary: 1890, paidAmount: 1890, remaining: 0, status: "paid" },
    { employee: "Mike Chen", totalHours: "40.0", rate: 40, totalSalary: 1600, paidAmount: 1600, remaining: 0, status: "paid" },
    { employee: "Lisa Park", totalHours: "44.0", rate: 55, totalSalary: 2420, paidAmount: 1210, remaining: 1210, status: "partial" },
    { employee: "James Wilson", totalHours: "38.0", rate: 50, totalSalary: 1900, paidAmount: 0, remaining: 1900, status: "unpaid" },
    { employee: "Emma Davis", totalHours: "41.0", rate: 42, totalSalary: 1722, paidAmount: 1722, remaining: 0, status: "paid" },
  ],
  monthly: [
    { employee: "Sarah Johnson", totalHours: "176.5", rate: 45, totalSalary: 7942.5, paidAmount: 7942.5, remaining: 0, status: "paid" },
    { employee: "Mike Chen", totalHours: "168.0", rate: 40, totalSalary: 6720, paidAmount: 6720, remaining: 0, status: "paid" },
    { employee: "Lisa Park", totalHours: "184.0", rate: 55, totalSalary: 10120, paidAmount: 5060, remaining: 5060, status: "partial" },
    { employee: "James Wilson", totalHours: "152.0", rate: 50, totalSalary: 7600, paidAmount: 0, remaining: 7600, status: "unpaid" },
    { employee: "Emma Davis", totalHours: "172.0", rate: 42, totalSalary: 7224, paidAmount: 7224, remaining: 0, status: "paid" },
  ],
  yearly: [
    { employee: "Sarah Johnson", totalHours: "2100.0", rate: 45, totalSalary: 94500, paidAmount: 94500, remaining: 0, status: "paid" },
    { employee: "Mike Chen", totalHours: "2016.0", rate: 40, totalSalary: 80640, paidAmount: 80640, remaining: 0, status: "paid" },
    { employee: "Lisa Park", totalHours: "2208.0", rate: 55, totalSalary: 121440, paidAmount: 60720, remaining: 60720, status: "partial" },
    { employee: "James Wilson", totalHours: "1824.0", rate: 50, totalSalary: 91200, paidAmount: 45600, remaining: 45600, status: "partial" },
    { employee: "Emma Davis", totalHours: "2064.0", rate: 42, totalSalary: 86688, paidAmount: 86688, remaining: 0, status: "paid" },
  ],
};

const periodLabels = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

const recentActivity = [
  { employee: "Sarah Johnson", action: "Checked In", time: "08:02 AM", status: "active" },
  { employee: "Mike Chen", action: "Started Break", time: "10:15 AM", status: "active" },
  { employee: "Lisa Park", action: "Checked Out", time: "05:01 PM", status: "completed" },
  { employee: "James Wilson", action: "Late Check-In", time: "09:32 AM", status: "late" },
  { employee: "Emma Davis", action: "Checked In", time: "07:58 AM", status: "active" },
  { employee: "Carlos Martinez", action: "Absent", time: "—", status: "absent" },
];

const statusMap: Record<string, string> = {
  active: "status-active",
  late: "status-late",
  absent: "status-absent",
  completed: "status-completed",
};

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("monthly");

  const attendance = attendanceData[period];
  const payroll = payrollData[period];

  const totalEmployees = attendance.length;
  const totalHoursWorked = attendance.reduce((sum, e) => sum + parseFloat(e.totalHours), 0);
  const totalDaysWorked = attendance.reduce((sum, e) => sum + e.daysWorked, 0);
  const totalPayroll = payroll.reduce((sum, e) => sum + e.totalSalary, 0);
  const totalPaid = payroll.reduce((sum, e) => sum + e.paidAmount, 0);
  const totalRemaining = payroll.reduce((sum, e) => sum + e.remaining, 0);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{periodLabels[period]} attendance & payroll reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <StatCard title="Total Paid" value={`$${totalPaid.toLocaleString()}`} icon={CheckCircle} variant="success" />
        <StatCard title="Remaining" value={`$${totalRemaining.toLocaleString()}`} icon={DollarSign} variant="default" />
        <StatCard title="Avg Hours/Employee" value={(totalHoursWorked / totalEmployees).toFixed(1)} icon={Clock} variant="accent" />
      </div>

      {/* Attendance Summary */}
      <div className="rounded-md border bg-card shadow-sm mb-6">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Attendance Summary — {periodLabels[period]}
          </h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Days Worked</th>
              <th>Total Hours</th>
              <th>Avg Hours/Day</th>
              <th>Late Count</th>
              <th>Absent Count</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((e, i) => (
              <tr key={i}>
                <td className="font-medium">{e.employee}</td>
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
            Payroll Summary — {periodLabels[period]}
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
              <th>Total Hours</th>
              <th>Rate</th>
              <th>Total Salary</th>
              <th>Paid</th>
              <th>Remaining</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {payroll.map((e, i) => (
              <tr key={i}>
                <td className="font-medium">{e.employee}</td>
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
