import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Users, Clock, CalendarDays, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type Period = "weekly" | "monthly" | "yearly";

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

const periodLabels = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

const statusMap: Record<string, string> = {
  active: "status-active",
  late: "status-late",
  absent: "status-absent",
  completed: "status-completed",
  pending: "status-pending",
  checked_in: "status-active",
  on_break: "status-pending",
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

export default function ReportsPage() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [period, setPeriod] = useState<Period>("monthly");
  const [requests, setRequests] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Employee";

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

      const { data: records } = await query;
      setAttendanceRecords(records || []);

      if (isAdmin) {
        const { data: profileData } = await supabase.from("profiles").select("user_id, full_name, email");
        setProfiles(profileData || []);
      } else {
        const { data: reqs } = await supabase
          .from("correction_requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        setRequests(reqs || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, period, isAdmin]);

  const getName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || userId.slice(0, 8) + "...";
  };

  const computeHours = (record: any): number => {
    if (!record.check_in_time || !record.check_out_time) return 0;
    const diff = new Date(record.check_out_time).getTime() - new Date(record.check_in_time).getTime();
    const breakMs = Number(record.break_duration_ms) || 0;
    return Math.max(0, (diff - breakMs) / 3600000);
  };

  if (isAdmin) {
    const byUser: Record<string, any[]> = {};
    attendanceRecords.forEach((r) => {
      if (!byUser[r.user_id]) byUser[r.user_id] = [];
      byUser[r.user_id].push(r);
    });

    const userSummaries = Object.entries(byUser).map(([userId, records]) => {
      const daysWorked = records.filter((r) => r.status === "completed").length;
      const totalHours = records.reduce((sum, r) => sum + computeHours(r), 0);
      return {
        userId,
        name: getName(userId),
        daysWorked,
        totalHours: totalHours.toFixed(1),
        avgHours: daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : "0.0",
      };
    });

    const totalEmployees = userSummaries.length;
    const totalHoursWorked = userSummaries.reduce((s, u) => s + parseFloat(u.totalHours), 0);
    const totalDaysWorked = userSummaries.reduce((s, u) => s + u.daysWorked, 0);

    const today = new Date().toISOString().split("T")[0];
    const todayRecords = attendanceRecords.filter((r) => r.date === today);

    return (
      <DashboardLayout>
        <div className="page-header flex-wrap gap-3">
          <div>
            <h1 className="page-title">Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{periodLabels[period]} attendance reports</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" /> Export PDF</Button>
            <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5 mr-1.5" /> Export Excel</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <StatCard title="Total Employees" value={totalEmployees} icon={Users} variant="accent" />
          <StatCard title="Total Hours Worked" value={totalHoursWorked.toFixed(1)} icon={Clock} variant="default" />
          <StatCard title="Total Days Worked" value={totalDaysWorked} icon={CalendarDays} variant="success" />
          <StatCard title="Avg Hours/Employee" value={totalEmployees > 0 ? (totalHoursWorked / totalEmployees).toFixed(1) : "0"} icon={Clock} variant="warning" />
        </div>

        <div className="rounded-md border bg-card shadow-sm mb-6 overflow-x-auto">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" /> Attendance Summary — {periodLabels[period]}</h2>
          </div>
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
          ) : userSummaries.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No attendance data for this period.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Days Worked</th><th>Total Hours</th><th>Avg Hours/Day</th></tr></thead>
              <tbody>
                {userSummaries.map((u) => (
                  <tr key={u.userId}>
                    <td className="font-medium">{u.name}</td>
                    <td className="mono">{u.daysWorked}</td>
                    <td className="mono">{u.totalHours}</td>
                    <td className="mono">{u.avgHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="text-sm font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> Today's Activity</h2>
          </div>
          {todayRecords.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No activity today.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
              <tbody>
                {todayRecords.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium">{getName(r.user_id)}</td>
                    <td className="mono">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                    <td className="mono">{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                    <td><span className={`status-badge ${statusMap[r.status] || "status-pending"}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, " ")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ─── EMPLOYEE VIEW ───
  const completedRecords = attendanceRecords.filter((r) => r.status === "completed");
  const daysWorked = completedRecords.length;
  const totalHours = attendanceRecords.reduce((s, r) => s + computeHours(r), 0);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl w-full space-y-6 py-2">
        <div className="page-header flex-wrap gap-3">
          <div>
            <h1 className="page-title">My Reports</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{periodLabels[period]} summary for {displayName}</p>
          </div>
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard title="Days Worked" value={daysWorked} icon={CalendarDays} variant="accent" />
          <StatCard title="Total Hours" value={totalHours.toFixed(1)} icon={Clock} variant="default" />
          <StatCard title="Avg Hours/Day" value={daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : "0"} icon={Clock} variant="warning" />
          <StatCard title="Records" value={attendanceRecords.length} icon={Users} variant="default" />
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" /> Recent Attendance
            </h2>
          </div>
          {loading ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
          ) : attendanceRecords.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No attendance records for this period.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
              <tbody>
                {attendanceRecords.map((r) => {
                  const hours = computeHours(r);
                  return (
                    <tr key={r.id}>
                      <td className="font-medium">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                      <td className="mono">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                      <td className="mono">{r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"}</td>
                      <td className="mono">{hours > 0 ? hours.toFixed(1) : "—"}</td>
                      <td><span className={`status-badge ${statusMap[r.status] || "status-pending"}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, " ")}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
          <div className="border-b px-5 py-3">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" /> My Correction Requests
            </h2>
          </div>
          {requests.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground text-center">No correction requests yet.</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Date</th><th>Type</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td className="mono">{r.request_date}</td>
                    <td>{r.request_type.replace(/_/g, " ")}</td>
                    <td><span className={`status-badge ${r.status === "approved" ? "status-completed" : r.status === "rejected" ? "status-absent" : "status-pending"}`}>{r.status.charAt(0).toUpperCase() + r.status.slice(1)}</span></td>
                    <td className="text-muted-foreground">{r.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
