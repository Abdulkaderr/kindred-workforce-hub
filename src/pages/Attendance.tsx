import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Clock, UserCheck, AlertTriangle, CalendarDays, Pencil, Save, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editStatus, setEditStatus] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const { from, to } = getPeriodRange(period);
    setLoading(true);

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

  useEffect(() => {
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

  const startEdit = (r: AttendanceRecord) => {
    setEditingId(r.id);
    setEditCheckIn(r.check_in_time ? new Date(r.check_in_time).toISOString().slice(0, 16) : "");
    setEditCheckOut(r.check_out_time ? new Date(r.check_out_time).toISOString().slice(0, 16) : "");
    setEditStatus(r.status);
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (recordId: string) => {
    const update: any = {
      status: editStatus,
    };
    if (editCheckIn) update.check_in_time = new Date(editCheckIn).toISOString();
    else update.check_in_time = null;
    if (editCheckOut) update.check_out_time = new Date(editCheckOut).toISOString();
    else update.check_out_time = null;

    const { error } = await supabase.from("attendance_records").update(update).eq("id", recordId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Record updated" });
      setEditingId(null);
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">{isAdmin ? "Attendance" : "My Attendance"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? "Company-wide attendance records" : `Attendance for ${displayName}`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
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

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
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
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const hours = computeHours(r);
                const breakMins = Math.round((r.break_duration_ms || 0) / 60000);
                const isEditing = editingId === r.id;

                return (
                  <tr key={r.id}>
                    {isAdmin && <td className="font-medium">{getName(r.user_id)}</td>}
                    <td className="mono">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="mono">
                      {isEditing ? (
                        <Input type="datetime-local" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} className="h-8 w-40 text-xs" />
                      ) : (
                        r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"
                      )}
                    </td>
                    <td className="mono">
                      {isEditing ? (
                        <Input type="datetime-local" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} className="h-8 w-40 text-xs" />
                      ) : (
                        r.check_out_time ? new Date(r.check_out_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }) : "—"
                      )}
                    </td>
                    <td className="mono">{breakMins > 0 ? `${breakMins}m` : "—"}</td>
                    <td className="mono">{hours > 0 ? hours.toFixed(1) : "—"}</td>
                    <td>
                      {isEditing ? (
                        <Select value={editStatus} onValueChange={setEditStatus}>
                          <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="checked_in">Checked In</SelectItem>
                            <SelectItem value="on_break">On Break</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className={`status-badge ${statusStyles[r.status] || "status-pending"}`}>
                          {r.status.charAt(0).toUpperCase() + r.status.slice(1).replace(/_/g, " ")}
                        </span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        {isEditing ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="default" onClick={() => saveEdit(r.id)}>
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    )}
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
