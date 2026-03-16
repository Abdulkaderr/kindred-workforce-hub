import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Clock, UserCheck, AlertTriangle, CalendarDays } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Period = "weekly" | "monthly" | "yearly";

type AttendanceRecord = {
  id: string;
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  break_duration_ms: number;
  status: string;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

const statusStyles: Record<string, string> = {
  checked_in: "status-active",
  on_break: "status-pending",
  completed: "status-completed",
  late: "status-late",
  absent: "status-absent",
};

function getPeriodRange(period: Period): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: Date;
  if (period === "weekly") {
    from = new Date(now); from.setDate(now.getDate() - 7);
  } else if (period === "monthly") {
    from = new Date(now); from.setMonth(now.getMonth() - 1);
  } else {
    from = new Date(now); from.setFullYear(now.getFullYear() - 1);
  }
  return { from: from.toISOString().split("T")[0], to };
}

export default function AttendancePage() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [period, setPeriod] = useState<Period>("monthly");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filterEmployee, setFilterEmployee] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const { from, to } = getPeriodRange(period);
    setLoading(true);

    const fetchData = async () => {
      let query = supabase
        .from("attendance_records")
        .select("*")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });

      if (!isAdmin) {
        query = query.eq("user_id", user.id);
      }

      const [recordsRes, profilesRes] = await Promise.all([
        query,
        isAdmin ? supabase.from("profiles").select("user_id, full_name, email") : Promise.resolve({ data: [] }),
      ]);

      setRecords(recordsRes.data || []);
      setProfiles(profilesRes.data || []);
      setLoading(false);
    };

    fetchData();
  }, [user, period, isAdmin]);

  const getName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || userId.slice(0, 8) + "...";
  };

  const employeeIds = useMemo(() => [...new Set(records.map((r) => r.user_id))], [records]);

  const filtered = useMemo(() => {
    if (filterEmployee === "all") return records;
    return records.filter((r) => r.user_id === filterEmployee);
  }, [records, filterEmployee]);

  const computeHours = (r: AttendanceRecord): number => {
    if (!r.check_in_time || !r.check_out_time) return 0;
    const diff = new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime();
    return Math.max(0, (diff - (r.break_duration_ms || 0)) / 3600000);
  };

  const totalHours = filtered.reduce((s, r) => s + computeHours(r), 0);
  const totalBreak = filtered.reduce((s, r) => s + (r.break_duration_ms || 0) / 3600000, 0);
  const daysWorked = filtered.filter((r) => r.status === "completed").length;

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Employee";

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? "Attendance" : "My Attendance"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? "Company-wide attendance records" : `Attendance for ${displayName}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Select value={filterEmployee} onValueChange={setFilterEmployee}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Employees" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                {employeeIds.map((id) => (
                  <SelectItem key={id} value={id}>{getName(id)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Days Worked" value={daysWorked} icon={CalendarDays} variant="accent" />
        <StatCard title="Total Hours" value={totalHours.toFixed(1)} icon={Clock} variant="success" />
        <StatCard title="Total Break" value={`${totalBreak.toFixed(1)}h`} icon={UserCheck} variant="default" />
        <StatCard title="Late Records" value={filtered.filter((r) => r.status === "late").length} icon={AlertTriangle} variant="warning" />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No records for this period.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Break</th>
                <th>Total Hours</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const hours = computeHours(r);
                const breakMins = Math.round((r.break_duration_ms || 0) / 60000);
                return (
                  <tr key={r.id}>
                    {isAdmin && <td className="font-medium">{getName(r.user_id)}</td>}
                    <td className="mono">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="mono">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                    <td className="mono">{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                    <td className="mono">{breakMins > 0 ? `${breakMins}m` : "—"}</td>
                    <td className="mono">{hours > 0 ? hours.toFixed(1) : "—"}</td>
                    <td>
                      <span className={`status-badge ${statusStyles[r.status] || "status-pending"}`}>
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
