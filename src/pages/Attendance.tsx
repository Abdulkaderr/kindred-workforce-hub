import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Clock, UserCheck, AlertTriangle, UserX } from "lucide-react";

const attendance = [
  { employee: "Sarah Johnson", company: "Acme Corp", checkIn: "08:02", checkOut: "—", breakTime: "00:30", totalHours: "—", status: "working" },
  { employee: "Mike Chen", company: "Acme Corp", checkIn: "08:15", checkOut: "—", breakTime: "00:15", totalHours: "—", status: "on-break" },
  { employee: "Lisa Park", company: "TechFlow Inc", checkIn: "07:55", checkOut: "17:01", breakTime: "01:00", totalHours: "8:06", status: "completed" },
  { employee: "James Wilson", company: "BuildRight Co", checkIn: "09:32", checkOut: "—", breakTime: "00:00", totalHours: "—", status: "late" },
  { employee: "Emma Davis", company: "TechFlow Inc", checkIn: "07:58", checkOut: "—", breakTime: "00:45", totalHours: "—", status: "working" },
  { employee: "Carlos Martinez", company: "Acme Corp", checkIn: "—", checkOut: "—", breakTime: "—", totalHours: "—", status: "absent" },
];

const statusStyles: Record<string, string> = {
  working: "status-active",
  "on-break": "status-pending",
  completed: "status-completed",
  late: "status-late",
  absent: "status-absent",
};

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Today's attendance records</p>
        </div>
        <p className="mono text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Currently Working" value={412} icon={UserCheck} variant="accent" />
        <StatCard title="On Break" value={45} icon={Clock} variant="default" />
        <StatCard title="Late Today" value={18} icon={AlertTriangle} variant="warning" />
        <StatCard title="Absent" value={42} icon={UserX} variant="default" />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Break</th>
              <th>Total Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((a, i) => (
              <tr key={i}>
                <td className="font-medium">{a.employee}</td>
                <td className="text-muted-foreground">{a.company}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
