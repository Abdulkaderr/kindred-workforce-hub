import { useState, useEffect, useMemo } from "react";
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

type PayrollRecord = {
  id: string;
  user_id: string;
  period_type: string;
  period_start: string;
  period_end: string;
  total_hours: number;
  hourly_rate: number;
  total_salary: number;
  paid_amount: number;
  status: string;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

type Period = "weekly" | "monthly" | "yearly";

const periodLabels: Record<Period, string> = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

export default function PayrollPage() {
  const { role, user } = useAuth();
  const isAdmin = role === "admin";
  const [period, setPeriod] = useState<Period>("monthly");
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"pay_remaining" | "make_payment">("make_payment");
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("payroll_records")
      .select("*")
      .eq("period_type", period)
      .order("period_start", { ascending: false });

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

  const totalSalary = records.reduce((s, p) => s + Number(p.total_salary), 0);
  const totalPaid = records.reduce((s, p) => s + Number(p.paid_amount), 0);
  const totalRemaining = totalSalary - totalPaid;
  const overdue = records.filter(p => p.status === "pending").reduce((s, p) => s + (Number(p.total_salary) - Number(p.paid_amount)), 0);

  const openModal = (record: PayrollRecord, type: "pay_remaining" | "make_payment") => {
    setSelectedRecord(record);
    setModalType(type);
    const remaining = Number(record.total_salary) - Number(record.paid_amount);
    setPaymentAmount(type === "pay_remaining" ? remaining.toString() : "");
    setPaymentNotes("");
    setModalOpen(true);
  };

  const handleSubmitPayment = async () => {
    if (!selectedRecord || !paymentAmount) return;
    const amount = Number(paymentAmount);
    const newPaid = Number(selectedRecord.paid_amount) + amount;
    const remaining = Number(selectedRecord.total_salary) - newPaid;
    const newStatus = remaining <= 0 ? "paid" : "partial";

    const { error } = await supabase
      .from("payroll_records")
      .update({ paid_amount: newPaid, status: newStatus })
      .eq("id", selectedRecord.id);

    if (error) {
      toast({ title: "Payment failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payment Recorded", description: `$${amount.toLocaleString()} payment recorded.` });
      setModalOpen(false);
      fetchData();
    }
  };

  const handleGeneratePayroll = async () => {
    // Generate payroll records from attendance data for all employees
    const now = new Date();
    let periodStart: Date, periodEnd: Date;

    if (period === "weekly") {
      periodEnd = new Date(now);
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
    } else if (period === "monthly") {
      periodEnd = new Date(now);
      periodStart = new Date(now);
      periodStart.setMonth(now.getMonth() - 1);
    } else {
      periodEnd = new Date(now);
      periodStart = new Date(now);
      periodStart.setFullYear(now.getFullYear() - 1);
    }

    const startStr = periodStart.toISOString().split("T")[0];
    const endStr = periodEnd.toISOString().split("T")[0];

    // Get attendance records
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("*")
      .gte("date", startStr)
      .lte("date", endStr);

    if (!attendance || attendance.length === 0) {
      toast({ title: "No attendance data", description: "No attendance records found for this period.", variant: "destructive" });
      return;
    }

    // Group by user
    const byUser: Record<string, number> = {};
    attendance.forEach((r) => {
      if (!r.check_in_time || !r.check_out_time) return;
      const diff = new Date(r.check_out_time).getTime() - new Date(r.check_in_time).getTime();
      const hours = Math.max(0, (diff - (r.break_duration_ms || 0)) / 3600000);
      byUser[r.user_id] = (byUser[r.user_id] || 0) + hours;
    });

    const defaultRate = 25; // Default hourly rate
    const inserts = Object.entries(byUser).map(([userId, hours]) => ({
      user_id: userId,
      period_type: period,
      period_start: startStr,
      period_end: endStr,
      total_hours: Math.round(hours * 10) / 10,
      hourly_rate: defaultRate,
      total_salary: Math.round(hours * defaultRate * 100) / 100,
      paid_amount: 0,
      status: "pending",
    }));

    const { error } = await supabase.from("payroll_records").insert(inserts);
    if (error) {
      toast({ title: "Failed to generate payroll", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Payroll generated", description: `${inserts.length} payroll records created.` });
      fetchData();
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{periodLabels[period]} payroll management</p>
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
        ) : records.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            No payroll records. {isAdmin ? "Click 'Generate Payroll' to create records from attendance data." : ""}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Total Hours</th>
                <th>Rate</th>
                <th>Total Salary</th>
                <th>Paid</th>
                <th>Remaining</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {records.map((p) => {
                const remaining = Number(p.total_salary) - Number(p.paid_amount);
                return (
                  <tr key={p.id}>
                    <td className="font-medium">{isAdmin ? getName(p.user_id) : (user?.user_metadata?.full_name || "Me")}</td>
                    <td className="mono text-xs">{p.period_start} → {p.period_end}</td>
                    <td className="mono">{Number(p.total_hours).toFixed(1)}</td>
                    <td className="mono">${Number(p.hourly_rate)}/hr</td>
                    <td className="mono font-medium">${Number(p.total_salary).toLocaleString()}</td>
                    <td className="mono text-success">${Number(p.paid_amount).toLocaleString()}</td>
                    <td className="mono">
                      {remaining > 0 ? <span className="text-warning">${remaining.toLocaleString()}</span> : "$0"}
                    </td>
                    <td>
                      <span className={`status-badge ${p.status === "paid" ? "status-completed" : p.status === "partial" ? "status-pending" : "status-late"}`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                    </td>
                    {isAdmin && (
                      <td>
                        {p.status !== "paid" ? (
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="outline" onClick={() => openModal(p, "pay_remaining")}>
                              Pay Remaining
                            </Button>
                            <Button size="sm" variant="default" onClick={() => openModal(p, "make_payment")}>
                              Make Payment
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Completed</span>
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

      {/* Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === "pay_remaining" ? "Pay Remaining Balance" : "Make Payment"}
            </DialogTitle>
            <DialogDescription>
              {selectedRecord && `Recording payment for ${getName(selectedRecord.user_id)}`}
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Salary</span>
                  <span className="font-medium">${Number(selectedRecord.total_salary).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="text-success font-medium">${Number(selectedRecord.paid_amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="text-warning font-medium">${(Number(selectedRecord.total_salary) - Number(selectedRecord.paid_amount)).toLocaleString()}</span>
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
