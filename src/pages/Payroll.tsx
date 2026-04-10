import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { EmployeePayrollList } from "@/components/payroll/EmployeePayrollList";
import { WeekList, type WeekSummary } from "@/components/payroll/WeekList";
import { WeekDetails, type DayDetail } from "@/components/payroll/WeekDetails";

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  hourly_rate: number;
};

type EmployeeSummary = {
  user_id: string;
  name: string;
  totalHours: number;
  totalSalary: number;
  totalPaid: number;
  remaining: number;
};

type View = "employees" | "weeks" | "details";

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  return monday.toISOString().split("T")[0];
}

function getWeekEnd(weekStart: string): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return d.toISOString().split("T")[0];
}

function getWeekNumber(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const dayNum = d.getDay() || 7;
  d.setDate(d.getDate() + 4 - dayNum);
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function formatWeekLabel(start: string, end: string): string {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("nl-NL", opts)} — ${e.toLocaleDateString("nl-NL", opts)}`;
}

function getYearRange(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export default function PayrollPage() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [view, setView] = useState<View>("employees");
  const [loading, setLoading] = useState(true);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [allAttendance, setAllAttendance] = useState<any[]>([]);
  const [allPayroll, setAllPayroll] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<WeekSummary | null>(null);

  // Generate year options (current year + 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - i);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { from, to } = getYearRange(selectedYear);

    const profileQuery = isAdmin
      ? supabase.from("profiles").select("user_id, full_name, email, hourly_rate")
      : supabase.from("profiles").select("user_id, full_name, email, hourly_rate").eq("user_id", user.id);

    const attendanceQuery = isAdmin
      ? supabase.from("attendance_records").select("*").gte("date", from).lte("date", to)
      : supabase.from("attendance_records").select("*").eq("user_id", user.id).gte("date", from).lte("date", to);

    const payrollQuery = isAdmin
      ? supabase.from("payroll_records").select("*").gte("period_start", from).lte("period_end", to)
      : supabase.from("payroll_records").select("*").eq("user_id", user.id).gte("period_start", from).lte("period_end", to);

    const [pRes, aRes, prRes, projRes] = await Promise.all([
      profileQuery,
      attendanceQuery,
      payrollQuery,
      supabase.from("projects").select("id, name, location"),
    ]);

    setProfiles((pRes.data || []) as Profile[]);
    setAllAttendance(aRes.data || []);
    setAllPayroll(prRes.data || []);
    setProjects(projRes.data || []);
    setLoading(false);
  }, [user, isAdmin, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calcHours = (r: any): number => {
    if (!r.check_in_time || !r.check_out_time) return 0;
    const diff = new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime();
    return Math.max(0, (diff - (r.break_duration_ms || 0)) / 3600000);
  };

  const employeeSummaries: EmployeeSummary[] = profiles.map((p) => {
    const records = allAttendance.filter((a: any) => a.user_id === p.user_id);
    const totalHours = Math.round(records.reduce((s: number, r: any) => s + calcHours(r), 0) * 10) / 10;
    const rate = Number(p.hourly_rate) || 0;
    const totalSalary = Math.round(totalHours * rate * 100) / 100;
    const totalPaid = allPayroll
      .filter((pr: any) => pr.user_id === p.user_id)
      .reduce((s: number, pr: any) => s + Number(pr.paid_amount || 0), 0);
    const remaining = Math.max(0, totalSalary - totalPaid);

    return {
      user_id: p.user_id,
      name: p.full_name || p.email?.split("@")[0] || p.user_id.slice(0, 8),
      totalHours,
      totalSalary,
      totalPaid,
      remaining,
    };
  });

  const totalSalary = employeeSummaries.reduce((s, e) => s + e.totalSalary, 0);
  const totalPaid = employeeSummaries.reduce((s, e) => s + e.totalPaid, 0);
  const totalRemaining = employeeSummaries.reduce((s, e) => s + e.remaining, 0);

  const selectedProfile = profiles.find((p) => p.user_id === selectedUserId);
  const selectedName = selectedProfile?.full_name || selectedProfile?.email?.split("@")[0] || "";
  const selectedRate = Number(selectedProfile?.hourly_rate) || 0;

  const buildWeeks = (): WeekSummary[] => {
    if (!selectedUserId) return [];
    const records = allAttendance.filter((a: any) => a.user_id === selectedUserId);
    const weekMap = new Map<string, any[]>();

    records.forEach((r: any) => {
      const ws = getWeekStart(r.date);
      if (!weekMap.has(ws)) weekMap.set(ws, []);
      weekMap.get(ws)!.push(r);
    });

    const weeks: WeekSummary[] = [];
    weekMap.forEach((recs, ws) => {
      const we = getWeekEnd(ws);
      const totalHours = Math.round(recs.reduce((s: number, r: any) => s + calcHours(r), 0) * 10) / 10;
      const totalSalary = Math.round(totalHours * selectedRate * 100) / 100;

      const payrollRec = allPayroll.find(
        (pr: any) => pr.user_id === selectedUserId && pr.period_start === ws && pr.period_end === we
      );
      const paid = payrollRec ? Number(payrollRec.paid_amount || 0) : 0;
      const remaining = Math.max(0, totalSalary - paid);
      const status: WeekSummary["status"] =
        remaining <= 0 && totalSalary > 0 ? "Betaald" : paid > 0 ? "Deels" : "Openstaand";

      weeks.push({
        weekStart: ws,
        weekEnd: we,
        weekLabel: formatWeekLabel(ws, we),
        weekNumber: getWeekNumber(ws),
        totalHours,
        totalSalary,
        paid,
        remaining,
        status,
        payrollId: payrollRec?.id || null,
        paymentDate: payrollRec?.payment_date || null,
      });
    });

    weeks.sort((a, b) => b.weekStart.localeCompare(a.weekStart));
    return weeks;
  };

  const buildDays = (): DayDetail[] => {
    if (!selectedUserId || !selectedWeek) return [];
    const records = allAttendance
      .filter(
        (a: any) =>
          a.user_id === selectedUserId &&
          a.date >= selectedWeek.weekStart &&
          a.date <= selectedWeek.weekEnd
      )
      .sort((a: any, b: any) => a.date.localeCompare(b.date));

    return records.map((r: any) => {
      const hours = Math.round(calcHours(r) * 10) / 10;
      const project = projects.find((p: any) => p.id === r.project_id);
      return {
        date: r.date,
        checkIn: r.check_in_time,
        checkOut: r.check_out_time,
        breakMs: r.break_duration_ms || 0,
        hours,
        salary: Math.round(hours * selectedRate * 100) / 100,
        projectName: project ? `${project.name} — ${project.location}` : "-",
      };
    });
  };

  const handlePayment = async (amount: number) => {
    if (!selectedUserId || !selectedWeek) return;
    const newPaid = selectedWeek.paid + amount;
    const newRemaining = Math.max(0, selectedWeek.totalSalary - newPaid);
    const newStatus = newRemaining <= 0 ? "paid" : "partial";
    const today = new Date().toISOString().split("T")[0];

    if (selectedWeek.payrollId) {
      const { error } = await supabase
        .from("payroll_records")
        .update({
          paid_amount: newPaid,
          status: newStatus,
          total_hours: selectedWeek.totalHours,
          hourly_rate: selectedRate,
          total_salary: selectedWeek.totalSalary,
          payment_date: today,
        } as any)
        .eq("id", selectedWeek.payrollId);
      if (error) {
        toast({ title: "Betaling mislukt", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase.from("payroll_records").insert({
        user_id: selectedUserId,
        period_type: "weekly",
        period_start: selectedWeek.weekStart,
        period_end: selectedWeek.weekEnd,
        total_hours: selectedWeek.totalHours,
        hourly_rate: selectedRate,
        total_salary: selectedWeek.totalSalary,
        paid_amount: amount,
        status: newStatus,
        payment_date: today,
      } as any);
      if (error) {
        toast({ title: "Betaling mislukt", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Betaling vastgelegd", description: `€${amount.toLocaleString()} betaald.` });
    await fetchData();
    const freshWeeks = buildWeeks();
    const updated = freshWeeks.find((w) => w.weekStart === selectedWeek.weekStart);
    if (updated) setSelectedWeek(updated);
  };

  const handleDeletePayment = async (payrollId: string) => {
    if (!confirm("Weet je zeker dat je deze betaling wilt verwijderen?")) return;
    const { error } = await supabase.from("payroll_records").delete().eq("id", payrollId);
    if (error) {
      toast({ title: "Verwijderen mislukt", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Betaling verwijderd" });
    await fetchData();
    if (selectedWeek) {
      const freshWeeks = buildWeeks();
      const updated = freshWeeks.find((w) => w.weekStart === selectedWeek.weekStart);
      if (updated) setSelectedWeek(updated);
      else setSelectedWeek(null);
    }
  };

  const selectEmployee = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedWeek(null);
    setView("weeks");
  };

  const selectWeek = (week: WeekSummary) => {
    setSelectedWeek(week);
    setView("details");
  };

  const backToEmployees = () => {
    setSelectedUserId(null);
    setView("employees");
  };

  const backToWeeks = () => {
    setSelectedWeek(null);
    setView("weeks");
  };

  useEffect(() => {
    if (!isAdmin && user && profiles.length > 0) {
      setSelectedUserId(user.id);
      setView("weeks");
    }
  }, [isAdmin, user, profiles]);

  const weeks = view !== "employees" ? buildWeeks() : [];
  const days = view === "details" ? buildDays() : [];

  useEffect(() => {
    if (selectedWeek && selectedUserId) {
      const freshWeeks = buildWeeks();
      const updated = freshWeeks.find((w) => w.weekStart === selectedWeek.weekStart);
      if (updated) setSelectedWeek(updated);
    }
  }, [allPayroll, allAttendance]);

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3 mb-6">
        <div>
          <h1 className="page-title">Loonadministratie</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Beheer betalingen per medewerker en per week
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {view === "employees" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
            <StatCard title="Totaal Salaris" value={`€${totalSalary.toLocaleString()}`} icon={DollarSign} variant="default" />
            <StatCard title="Betaald" value={`€${totalPaid.toLocaleString()}`} icon={CheckCircle} variant="success" />
            <StatCard title="Resterend" value={`€${totalRemaining.toLocaleString()}`} icon={Clock} variant="warning" />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">Laden...</p>
          ) : (
            <EmployeePayrollList employees={employeeSummaries} onSelect={selectEmployee} />
          )}
        </>
      )}

      {view === "weeks" && (
        <WeekList
          employeeName={selectedName}
          weeks={weeks}
          onSelectWeek={selectWeek}
          onBack={backToEmployees}
          onDeletePayment={isAdmin ? handleDeletePayment : undefined}
        />
      )}

      {view === "details" && selectedWeek && (
        <WeekDetails
          employeeName={selectedName}
          week={selectedWeek}
          days={days}
          rate={selectedRate}
          onBack={backToWeeks}
          onPayment={handlePayment}
          isAdmin={isAdmin}
        />
      )}
    </DashboardLayout>
  );
}
