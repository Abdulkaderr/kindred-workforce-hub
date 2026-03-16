import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  hourly_rate: number;
};

type PayrollRow = {
  user_id: string;
  name: string;
  rate: number;
  totalHours: number;
  totalSalary: number;
  paid: number;
  remaining: number;
  status: "Paid" | "Partial" | "Pending";
  payrollId: string | null;
};

type Period = "weekly" | "monthly" | "yearly";

const periodLabels: Record<Period, string> = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

/** Returns a fixed calendar period range based on current date */
function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  if (period === "monthly") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  } else if (period === "weekly") {
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day); // Sunday
    const end = new Date(start);
    end.setDate(start.getDate() + 6); // Saturday
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  } else {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    return { start: start.toISOString().split("T")[0], end: end.toISOString().split("T")[0] };
  }
}

export default function PayrollPage() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [period, setPeriod] = useState<Period>("monthly");
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"pay_remaining" | "make_payment">("make_payment");
  const [selectedRow, setSelectedRow] = useState<PayrollRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const { start, end } = getPeriodRange(period);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch attendance, profiles, and payroll records filtered by period date range
    const attendanceQuery = isAdmin
      ? supabase.from("attendance_records").select("*").gte("date", start).lte("date", end)
      : supabase.from("attendance_records").select("*").eq("user_id", user.id).gte("date", start).lte("date", end);

    const payrollQuery = isAdmin
      ? supabase.from("payroll_records").select("*").gte("period_start", start).lte("period_end", end)
      : supabase.from("payroll_records").select("*").eq("user_id", user.id).gte("period_start", start).lte("period_end", end);

    const [attendanceRes, profilesRes, payrollRes] = await Promise.all([
      attendanceQuery,
      isAdmin
        ? supabase.from("profiles").select("user_id, full_name, email, hourly_rate")
        : supabase.from("profiles").select("user_id, full_name, email, hourly_rate").eq("user_id", user.id),
      payrollQuery,
    ]);

    const attendance = attendanceRes.data || [];
    const profiles = (profilesRes.data || []) as Profile[];
    const payrollRecords = payrollRes.data || [];

    // Calculate hours per user from attendance
    const hoursByUser: Record<string, number> = {};
    attendance.forEach((r: any) => {
      if (!r.check_in_time || !r.check_out_time) return;
      const diff = new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime();
      const hours = Math.max(0, (diff - (r.break_duration_ms || 0)) / 3600000);
      hoursByUser[r.user_id] = (hoursByUser[r.user_id] || 0) + hours;
    });

    // Map payroll records by user_id — use most recent per user for this period
    const payrollByUser: Record<string, any> = {};
    payrollRecords.forEach((pr: any) => {
      if (!payrollByUser[pr.user_id] || pr.created_at > payrollByUser[pr.user_id].created_at) {
        payrollByUser[pr.user_id] = pr;
      }
    });

    // Build rows
    const userIds = new Set([...Object.keys(hoursByUser), ...Object.keys(payrollByUser)]);
    const profileMap = new Map(profiles.map((p) => [p.user_id, p]));

    const computed: PayrollRow[] = [];
    userIds.forEach((uid) => {
      const profile = profileMap.get(uid);
      const rate = Number(profile?.hourly_rate) || 0;
      const totalHours = Math.round((hoursByUser[uid] || 0) * 10) / 10;
      const totalSalary = Math.round(rate * totalHours * 100) / 100;
      const pr = payrollByUser[uid];
      // Always preserve existing paid amount — never overwrite
      const paid = pr ? Number(pr.paid_amount) : 0;
      const remaining = Math.max(0, totalSalary - paid);
      const status: PayrollRow["status"] = remaining <= 0 && totalSalary > 0 ? "Paid" : paid > 0 ? "Partial" : "Pending";

      computed.push({
        user_id: uid,
        name: profile?.full_name || profile?.email?.split("@")[0] || uid.slice(0, 8) + "...",
        rate,
        totalHours,
        totalSalary,
        paid,
        remaining,
        status,
        payrollId: pr?.id || null,
      });
    });

    setRows(computed);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, period, isAdmin]);

  const totalSalary = rows.reduce((s, r) => s + r.totalSalary, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid, 0);
  const totalRemaining = rows.reduce((s, r) => s + r.remaining, 0);
  const overdue = rows.filter((r) => r.status === "Pending").reduce((s, r) => s + r.remaining, 0);

  const openModal = (row: PayrollRow, type: "pay_remaining" | "make_payment") => {
    setSelectedRow(row);
    setModalType(type);
    setPaymentAmount(type === "pay_remaining" ? row.remaining.toString() : "");
    setPaymentNotes("");
    setModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedRow || !paymentAmount) return;
    const amount = Number(paymentAmount);
    if (amount <= 0) return;

    const newPaid = selectedRow.paid + amount;
    const newRemaining = Math.max(0, selectedRow.totalSalary - newPaid);
    const newStatus = newRemaining <= 0 ? "paid" : "partial";

    if (selectedRow.payrollId) {
      // Update existing record — only update paid_amount and recalculated fields
      const { error } = await supabase
        .from("payroll_records")
        .update({
          paid_amount: newPaid,
          status: newStatus,
          total_hours: selectedRow.totalHours,
          hourly_rate: selectedRow.rate,
          total_salary: selectedRow.totalSalary,
        })
        .eq("id", selectedRow.payrollId);

      if (error) {
        toast({ title: "Payment failed", description: error.message, variant: "destructive" });
        return;
      }
    } else {
      // Create new payroll record with the payment
      const { error } = await supabase.from("payroll_records").insert({
        user_id: selectedRow.user_id,
        period_type: period,
        period_start: start,
        period_end: end,
        total_hours: selectedRow.totalHours,
        hourly_rate: selectedRow.rate,
        total_salary: selectedRow.totalSalary,
        paid_amount: amount,
        status: newStatus,
      });

      if (error) {
        toast({ title: "Payment failed", description: error.message, variant: "destructive" });
        return;
      }
    }

    toast({ title: "Payment Recorded", description: `$${amount.toLocaleString()} payment recorded.` });
    setModalOpen(false);
    fetchData();
  };

  const handleGeneratePayroll = async () => {
    // Get attendance records for all employees in period
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("*")
      .gte("date", start)
      .lte("date", end);

    if (!attendance || attendance.length === 0) {
      toast({ title: "No attendance data", description: "No attendance records found for this period.", variant: "destructive" });
      return;
    }

    // Get all profiles for rates
    const { data: profiles } = await supabase.from("profiles").select("user_id, hourly_rate");
    const rateMap = new Map((profiles || []).map((p: any) => [p.user_id, Number(p.hourly_rate) || 0]));

    // Get existing payroll records for this period to preserve payments
    const { data: existingPayroll } = await supabase
      .from("payroll_records")
      .select("*")
      .gte("period_start", start)
      .lte("period_end", end);

    const existingByUser: Record<string, any> = {};
    (existingPayroll || []).forEach((pr: any) => {
      if (!existingByUser[pr.user_id] || pr.created_at > existingByUser[pr.user_id].created_at) {
        existingByUser[pr.user_id] = pr;
      }
    });

    // Calculate hours per user
    const hoursByUser: Record<string, number> = {};
    attendance.forEach((r: any) => {
      if (!r.check_in_time || !r.check_out_time) return;
      const diff = new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime();
      const hours = Math.max(0, (diff - (r.break_duration_ms || 0)) / 3600000);
      hoursByUser[r.user_id] = (hoursByUser[r.user_id] || 0) + hours;
    });

    const inserts: any[] = [];
    const updates: { id: string; data: any }[] = [];

    Object.entries(hoursByUser).forEach(([userId, hours]) => {
      const rate = rateMap.get(userId) || 0;
      const totalHours = Math.round(hours * 10) / 10;
      const totalSalary = Math.round(totalHours * rate * 100) / 100;
      const existing = existingByUser[userId];

      if (existing) {
        // Update hours/salary but PRESERVE paid_amount
        const paidAmount = Number(existing.paid_amount) || 0;
        const remaining = Math.max(0, totalSalary - paidAmount);
        const status = remaining <= 0 && totalSalary > 0 ? "paid" : paidAmount > 0 ? "partial" : "pending";
        updates.push({
          id: existing.id,
          data: {
            total_hours: totalHours,
            hourly_rate: rate,
            total_salary: totalSalary,
            status,
          },
        });
      } else {
        inserts.push({
          user_id: userId,
          period_type: period,
          period_start: start,
          period_end: end,
          total_hours: totalHours,
          hourly_rate: rate,
          total_salary: totalSalary,
          paid_amount: 0,
          status: "pending",
        });
      }
    });

    let hasError = false;

    if (inserts.length > 0) {
      const { error } = await supabase.from("payroll_records").insert(inserts);
      if (error) {
        toast({ title: "Failed to generate payroll", description: error.message, variant: "destructive" });
        hasError = true;
      }
    }

    for (const upd of updates) {
      const { error } = await supabase.from("payroll_records").update(upd.data).eq("id", upd.id);
      if (error) {
        toast({ title: "Failed to update payroll", description: error.message, variant: "destructive" });
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      toast({ title: "Payroll generated", description: `${inserts.length} created, ${updates.length} updated (payments preserved).` });
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {periodLabels[period]} payroll — {start} to {end}
          </p>
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
          {isAdmin && <Button onClick={handleGeneratePayroll}>Generate Payroll</Button>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Payroll" value={`$${totalSalary.toLocaleString()}`} icon={DollarSign} variant="default" />
        <StatCard title="Total Paid" value={`$${totalPaid.toLocaleString()}`} icon={CheckCircle} variant="success" />
        <StatCard title="Remaining" value={`$${totalRemaining.toLocaleString()}`} icon={Clock} variant="warning" />
        <StatCard title="Overdue" value={`$${overdue.toLocaleString()}`} icon={AlertTriangle} variant="default" />
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : rows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            No payroll data for this period. {isAdmin ? "Click 'Generate Payroll' to create records from attendance data." : ""}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Rate</th>
                <th>Period</th>
                <th>Total Hours</th>
                <th>Total Salary</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="font-medium">{r.name}</td>
                  <td className="mono">${r.rate}/hr</td>
                  <td className="mono text-xs">{start} → {end}</td>
                  <td className="mono">{r.totalHours.toFixed(1)}</td>
                  <td className="mono font-medium">${r.totalSalary.toLocaleString()}</td>
                  <td className="mono text-success">${r.paid.toLocaleString()}</td>
                  <td className="mono">
                    {r.remaining > 0 ? <span className="text-warning">${r.remaining.toLocaleString()}</span> : "$0"}
                  </td>
                  <td>
                    <span className={`status-badge ${r.status === "Paid" ? "status-completed" : r.status === "Partial" ? "status-pending" : "status-late"}`}>
                      {r.status}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      {r.status !== "Paid" ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openModal(r, "pay_remaining")}>
                            Pay Remaining
                          </Button>
                          <Button size="sm" variant="default" onClick={() => openModal(r, "make_payment")}>
                            Make Payment
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Completed</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === "pay_remaining" ? "Pay Remaining Balance" : "Make Payment"}
            </DialogTitle>
            <DialogDescription>
              {selectedRow && `Recording payment for ${selectedRow.name}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRow && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rate</span>
                  <span className="font-medium">${selectedRow.rate}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-medium">{selectedRow.totalHours.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Salary</span>
                  <span className="font-medium">${selectedRow.totalSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="text-success font-medium">${selectedRow.paid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="text-warning font-medium">${selectedRow.remaining.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add payment notes..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitPayment} disabled={!paymentAmount || Number(paymentAmount) <= 0}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
