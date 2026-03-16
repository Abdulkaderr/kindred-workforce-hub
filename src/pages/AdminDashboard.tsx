import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import {
  Users,
  Clock,
  UserCheck,
  AlertTriangle,
  UserX,
  CheckCircle,
  DollarSign,
} from "lucide-react";

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

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Admin overview and live activity</p>
        </div>
        <p className="mono text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Employees" value={24} icon={Users} trend={{ value: "+3 this month", positive: true }} variant="accent" />
        <StatCard title="Active Today" value={18} icon={UserCheck} variant="success" />
        <StatCard title="Total Payroll" value="$39,606" icon={DollarSign} variant="default" />
        <StatCard title="Currently Working" value={12} icon={Clock} variant="accent" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard title="Late Today" value={2} icon={AlertTriangle} variant="warning" />
        <StatCard title="Absent Today" value={4} icon={UserX} variant="default" />
        <StatCard title="Finished Work" value={6} icon={CheckCircle} variant="success" />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Live Activity Feed</h2>
          <span className="flex items-center gap-1.5 text-xs text-success font-medium">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse-subtle" />
            Live
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Action</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((item, i) => (
              <tr key={i}>
                <td className="font-medium">{item.employee}</td>
                <td>{item.action}</td>
                <td className="mono">{item.time}</td>
                <td>
                  <span className={`status-badge ${statusMap[item.status]}`}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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
