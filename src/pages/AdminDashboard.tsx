import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import {
  Users,
  Clock,
  UserCheck,
  AlertTriangle,
  UserX,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AttendanceRecord = {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  break_duration_ms: number;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

const statusMap: Record<string, string> = {
  checked_in: "status-active",
  on_break: "status-pending",
  completed: "status-completed",
  late: "status-late",
  absent: "status-absent",
};

export default function AdminDashboard() {
  const [todayRecords, setTodayRecords] = useState<AttendanceRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const today = new Date().toISOString().split("T")[0];

      const [recordsRes, profilesRes, rolesRes] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("*")
          .eq("date", today)
          .order("check_in_time", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name, email"),
        supabase.from("user_roles").select("user_id").eq("role", "employee"),
      ]);

      setTodayRecords(recordsRes.data || []);
      setProfiles(profilesRes.data || []);
      setTotalEmployees(rolesRes.data?.length || 0);
      setLoading(false);
    };

    fetchData();
  }, []);

  const getName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || userId.slice(0, 8) + "...";
  };

  const activeToday = todayRecords.filter((r) => r.check_in_time).length;
  const currentlyWorking = todayRecords.filter((r) => r.status === "checked_in").length;
  const lateToday = todayRecords.filter((r) => r.status === "late").length;
  const onBreak = todayRecords.filter((r) => r.status === "on_break").length;
  const finished = todayRecords.filter((r) => r.status === "completed").length;
  const absent = totalEmployees - activeToday;

  const formatAction = (status: string) => {
    switch (status) {
      case "checked_in": return "Checked In";
      case "on_break": return "On Break";
      case "completed": return "Checked Out";
      case "late": return "Late Check-In";
      default: return status;
    }
  };

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
        <StatCard title="Total Employees" value={totalEmployees} icon={Users} variant="accent" />
        <StatCard title="Active Today" value={activeToday} icon={UserCheck} variant="success" />
        <StatCard title="Currently Working" value={currentlyWorking} icon={Clock} variant="accent" />
        <StatCard title="On Break" value={onBreak} icon={Clock} variant="warning" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        <StatCard title="Late Today" value={lateToday} icon={AlertTriangle} variant="warning" />
        <StatCard title="Absent Today" value={Math.max(0, absent)} icon={UserX} variant="default" />
        <StatCard title="Finished Work" value={finished} icon={CheckCircle} variant="success" />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold">Live Activity Feed</h2>
          <span className="flex items-center gap-1.5 text-xs text-success font-medium">
            <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
            Live
          </span>
        </div>
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : todayRecords.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No activity today yet.</p>
        ) : (
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
              {todayRecords.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">{getName(r.user_id)}</td>
                  <td>{formatAction(r.status)}</td>
                  <td className="mono">
                    {r.check_in_time
                      ? new Date(r.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                      : "—"}
                  </td>
                  <td>
                    <span className={`status-badge ${statusMap[r.status] || "status-pending"}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, " ")}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
