import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import {
  Building2,
  Users,
  Clock,
  UserCheck,
  AlertTriangle,
  UserX,
  CheckCircle,
  DollarSign,
} from "lucide-react";

const recentActivity = [
  { employee: "Sarah Johnson", action: "Checked In", time: "08:02 AM", company: "Acme Corp", status: "active" },
  { employee: "Mike Chen", action: "Started Break", time: "10:15 AM", company: "Acme Corp", status: "active" },
  { employee: "Lisa Park", action: "Checked Out", time: "05:01 PM", company: "TechFlow Inc", status: "completed" },
  { employee: "James Wilson", action: "Late Check-In", time: "09:32 AM", company: "BuildRight Co", status: "late" },
  { employee: "Emma Davis", action: "Checked In", time: "07:58 AM", company: "TechFlow Inc", status: "active" },
  { employee: "Carlos Martinez", action: "Absent", time: "—", company: "Acme Corp", status: "absent" },
];

const statusMap: Record<string, string> = {
  active: "status-active",
  late: "status-late",
  absent: "status-absent",
  completed: "status-completed",
};

const Index = () => {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform overview and live activity</p>
        </div>
        <p className="mono text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Companies" value={12} icon={Building2} trend={{ value: "+2 this month", positive: true }} />
        <StatCard title="Total Employees" value={847} icon={Users} trend={{ value: "+34 this month", positive: true }} variant="accent" />
        <StatCard title="Active Today" value={623} icon={UserCheck} variant="success" />
        <StatCard title="Total Payroll" value="$284,500" icon={DollarSign} variant="default" />
      </div>

      {/* Live Activity Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Currently Working" value={412} icon={Clock} variant="accent" />
        <StatCard title="Late Today" value={18} icon={AlertTriangle} variant="warning" />
        <StatCard title="Absent Today" value={42} icon={UserX} variant="default" />
        <StatCard title="Finished Work" value={173} icon={CheckCircle} variant="success" />
      </div>

      {/* Live Activity Table */}
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
              <th>Company</th>
              <th>Action</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recentActivity.map((item, i) => (
              <tr key={i}>
                <td className="font-medium">{item.employee}</td>
                <td className="text-muted-foreground">{item.company}</td>
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
};

export default Index;
