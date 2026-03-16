import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Clock, UserCheck, AlertTriangle, UserX, CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const attendance = [
  { employee: "Sarah Johnson", company: "Acme Corp", checkIn: "08:02", checkOut: "17:05", breakTime: "00:30", totalHours: "8:33", status: "completed", date: "2026-03-16", week: 12, month: 3, year: 2026 },
  { employee: "Sarah Johnson", company: "Acme Corp", checkIn: "08:10", checkOut: "17:00", breakTime: "00:30", totalHours: "8:20", status: "completed", date: "2026-03-15", week: 11, month: 3, year: 2026 },
  { employee: "Mike Chen", company: "Acme Corp", checkIn: "08:15", checkOut: "—", breakTime: "00:15", totalHours: "—", status: "on-break", date: "2026-03-16", week: 12, month: 3, year: 2026 },
  { employee: "Lisa Park", company: "TechFlow Inc", checkIn: "07:55", checkOut: "17:01", breakTime: "01:00", totalHours: "8:06", status: "completed", date: "2026-03-16", week: 12, month: 3, year: 2026 },
  { employee: "James Wilson", company: "BuildRight Co", checkIn: "09:32", checkOut: "—", breakTime: "00:00", totalHours: "—", status: "late", date: "2026-03-16", week: 12, month: 3, year: 2026 },
  { employee: "Emma Davis", company: "TechFlow Inc", checkIn: "07:58", checkOut: "—", breakTime: "00:45", totalHours: "—", status: "working", date: "2026-03-16", week: 12, month: 3, year: 2026 },
  { employee: "Carlos Martinez", company: "Acme Corp", checkIn: "—", checkOut: "—", breakTime: "—", totalHours: "—", status: "absent", date: "2026-03-16", week: 12, month: 3, year: 2026 },
  { employee: "Lisa Park", company: "TechFlow Inc", checkIn: "08:00", checkOut: "17:10", breakTime: "00:45", totalHours: "8:25", status: "completed", date: "2026-02-20", week: 8, month: 2, year: 2026 },
  { employee: "James Wilson", company: "BuildRight Co", checkIn: "08:05", checkOut: "16:50", breakTime: "00:30", totalHours: "8:15", status: "completed", date: "2026-02-18", week: 8, month: 2, year: 2026 },
];

const employees = [...new Set(attendance.map(a => a.employee))];
const weeks = [...new Set(attendance.map(a => a.week))].sort((a, b) => a - b);
const months = [...new Set(attendance.map(a => a.month))].sort((a, b) => a - b);
const years = [...new Set(attendance.map(a => a.year))].sort((a, b) => a - b);

const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const statusStyles: Record<string, string> = {
  working: "status-active",
  "on-break": "status-pending",
  completed: "status-completed",
  late: "status-late",
  absent: "status-absent",
};

function parseHours(h: string): number {
  if (!h || h === "—") return 0;
  const [hrs, mins] = h.split(":").map(Number);
  return hrs + (mins || 0) / 60;
}

export default function AttendancePage() {
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [filterWeek, setFilterWeek] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterYear, setFilterYear] = useState("all");

  const filtered = useMemo(() => {
    return attendance.filter(a => {
      if (filterEmployee !== "all" && a.employee !== filterEmployee) return false;
      if (filterWeek !== "all" && a.week !== Number(filterWeek)) return false;
      if (filterMonth !== "all" && a.month !== Number(filterMonth)) return false;
      if (filterYear !== "all" && a.year !== Number(filterYear)) return false;
      return true;
    });
  }, [filterEmployee, filterWeek, filterMonth, filterYear]);

  const totalHours = filtered.reduce((sum, a) => sum + parseHours(a.totalHours), 0);
  const totalBreak = filtered.reduce((sum, a) => sum + parseHours(a.breakTime), 0);
  const daysWorked = filtered.filter(a => a.status !== "absent" && a.checkIn !== "—").length;
  const hasFilter = filterEmployee !== "all" || filterWeek !== "all" || filterMonth !== "all" || filterYear !== "all";

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Attendance records with filtering</p>
        </div>
        <p className="mono text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={filterEmployee} onValueChange={setFilterEmployee}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Employees" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterWeek} onValueChange={setFilterWeek}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Weeks" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Weeks</SelectItem>
            {weeks.map(w => <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterMonth} onValueChange={setFilterMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map(m => <SelectItem key={m} value={String(m)}>{monthNames[m]}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterYear} onValueChange={setFilterYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Days Worked" value={daysWorked} icon={CalendarDays} variant="accent" />
        <StatCard title="Total Hours" value={totalHours.toFixed(1)} icon={Clock} variant="success" />
        <StatCard title="Total Break Time" value={`${totalBreak.toFixed(1)}h`} icon={UserCheck} variant="default" />
        <StatCard
          title={hasFilter ? "Filtered Records" : "Late Today"}
          value={hasFilter ? filtered.length : filtered.filter(a => a.status === "late").length}
          icon={hasFilter ? UserCheck : AlertTriangle}
          variant={hasFilter ? "default" : "warning"}
        />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Break</th>
              <th>Total Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center text-muted-foreground py-8">No records match the selected filters</td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr key={i}>
                  <td className="font-medium">{a.employee}</td>
                  <td className="text-muted-foreground">{a.company}</td>
                  <td className="mono">{a.date}</td>
                  <td className="mono">{a.checkIn}</td>
                  <td className="mono">{a.checkOut}</td>
                  <td className="mono">{a.breakTime}</td>
                  <td className="mono">{a.totalHours}</td>
                  <td>
                    <span className={`status-badge ${statusStyles[a.status]}`}>
                      {a.status.charAt(0).toUpperCase() + a.status.slice(1).replace("-", " ")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
