import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type PayrollRecord = {
  employee: string;
  totalHours: number;
  paidHours: number;
  remainingHours: number;
  rate: number;
  totalSalary: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  period: "weekly" | "monthly" | "yearly";
};

const payrollData: PayrollRecord[] = [
  // Monthly records
  { employee: "Sarah Johnson", totalHours: 176.5, paidHours: 176.5, remainingHours: 0, rate: 45, totalSalary: 7942.5, paidAmount: 7942.5, remainingAmount: 0, status: "paid", period: "monthly" },
  { employee: "Mike Chen", totalHours: 168.0, paidHours: 168.0, remainingHours: 0, rate: 40, totalSalary: 6720, paidAmount: 6720, remainingAmount: 0, status: "paid", period: "monthly" },
  { employee: "Lisa Park", totalHours: 184.0, paidHours: 92.0, remainingHours: 92.0, rate: 55, totalSalary: 10120, paidAmount: 5060, remainingAmount: 5060, status: "partial", period: "monthly" },
  { employee: "James Wilson", totalHours: 152.0, paidHours: 0, remainingHours: 152.0, rate: 50, totalSalary: 7600, paidAmount: 0, remainingAmount: 7600, status: "pending", period: "monthly" },
  { employee: "Emma Davis", totalHours: 172.0, paidHours: 172.0, remainingHours: 0, rate: 42, totalSalary: 7224, paidAmount: 7224, remainingAmount: 0, status: "paid", period: "monthly" },
  // Weekly records
  { employee: "Sarah Johnson", totalHours: 42.0, paidHours: 42.0, remainingHours: 0, rate: 45, totalSalary: 1890, paidAmount: 1890, remainingAmount: 0, status: "paid", period: "weekly" },
  { employee: "Mike Chen", totalHours: 40.0, paidHours: 40.0, remainingHours: 0, rate: 40, totalSalary: 1600, paidAmount: 1600, remainingAmount: 0, status: "paid", period: "weekly" },
  { employee: "Lisa Park", totalHours: 44.0, paidHours: 22.0, remainingHours: 22.0, rate: 55, totalSalary: 2420, paidAmount: 1210, remainingAmount: 1210, status: "partial", period: "weekly" },
  { employee: "James Wilson", totalHours: 38.0, paidHours: 0, remainingHours: 38.0, rate: 50, totalSalary: 1900, paidAmount: 0, remainingAmount: 1900, status: "pending", period: "weekly" },
  { employee: "Emma Davis", totalHours: 41.0, paidHours: 41.0, remainingHours: 0, rate: 42, totalSalary: 1722, paidAmount: 1722, remainingAmount: 0, status: "paid", period: "weekly" },
  // Yearly records
  { employee: "Sarah Johnson", totalHours: 2100.0, paidHours: 2100.0, remainingHours: 0, rate: 45, totalSalary: 94500, paidAmount: 94500, remainingAmount: 0, status: "paid", period: "yearly" },
  { employee: "Mike Chen", totalHours: 2016.0, paidHours: 2016.0, remainingHours: 0, rate: 40, totalSalary: 80640, paidAmount: 80640, remainingAmount: 0, status: "paid", period: "yearly" },
  { employee: "Lisa Park", totalHours: 2208.0, paidHours: 1104.0, remainingHours: 1104.0, rate: 55, totalSalary: 121440, paidAmount: 60720, remainingAmount: 60720, status: "partial", period: "yearly" },
  { employee: "James Wilson", totalHours: 1824.0, paidHours: 912.0, remainingHours: 912.0, rate: 50, totalSalary: 91200, paidAmount: 45600, remainingAmount: 45600, status: "partial", period: "yearly" },
  { employee: "Emma Davis", totalHours: 2064.0, paidHours: 2064.0, remainingHours: 0, rate: 42, totalSalary: 86688, paidAmount: 86688, remainingAmount: 0, status: "paid", period: "yearly" },
];

const periodLabels = { weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

export default function PayrollPage() {
  const [period, setPeriod] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"pay_remaining" | "make_payment">("make_payment");
  const [selectedEmployee, setSelectedEmployee] = useState<PayrollRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const { toast } = useToast();

  const filtered = useMemo(() => payrollData.filter(p => p.period === period), [period]);

  const totalSalary = filtered.reduce((s, p) => s + p.totalSalary, 0);
  const totalPaid = filtered.reduce((s, p) => s + p.paidAmount, 0);
  const totalRemaining = filtered.reduce((s, p) => s + p.remainingAmount, 0);
  const overdue = filtered.filter(p => p.status === "pending").reduce((s, p) => s + p.remainingAmount, 0);

  const openModal = (record: PayrollRecord, type: "pay_remaining" | "make_payment") => {
    setSelectedEmployee(record);
    setModalType(type);
    setPaymentAmount(type === "pay_remaining" ? record.remainingAmount.toString() : "");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
    setModalOpen(true);
  };

  const handleSubmitPayment = () => {
    toast({
      title: "Payment Recorded",
      description: `$${Number(paymentAmount).toLocaleString()} payment for ${selectedEmployee?.employee} has been recorded.`,
    });
    setModalOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payroll</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{periodLabels[period]} payroll management</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button>Generate Payroll</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Total Payroll" value={`$${totalSalary.toLocaleString()}`} icon={DollarSign} variant="default" />
        <StatCard title="Total Paid" value={`$${totalPaid.toLocaleString()}`} icon={CheckCircle} variant="success" />
        <StatCard title="Remaining" value={`$${totalRemaining.toLocaleString()}`} icon={Clock} variant="warning" />
        <StatCard title="Overdue" value={`$${overdue.toLocaleString()}`} icon={AlertTriangle} variant="default" />
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Total Hours</th>
              <th>Paid Hours</th>
              <th>Remaining Hours</th>
              <th>Rate</th>
              <th>Total Salary</th>
              <th>Paid Amount</th>
              <th>Remaining</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={i}>
                <td className="font-medium">{p.employee}</td>
                <td className="mono">{p.totalHours.toFixed(1)}</td>
                <td className="mono text-success">{p.paidHours.toFixed(1)}</td>
                <td className="mono">{p.remainingHours > 0 ? <span className="text-warning">{p.remainingHours.toFixed(1)}</span> : "0.0"}</td>
                <td className="mono">${p.rate}/hr</td>
                <td className="mono font-medium">${p.totalSalary.toLocaleString()}</td>
                <td className="mono text-success">${p.paidAmount.toLocaleString()}</td>
                <td className="mono">{p.remainingAmount > 0 ? <span className="text-warning">${p.remainingAmount.toLocaleString()}</span> : "$0"}</td>
                <td>
                  <span className={`status-badge ${p.status === "paid" ? "status-completed" : p.status === "partial" ? "status-pending" : "status-late"}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalType === "pay_remaining" ? "Pay Remaining Balance" : "Make Payment"}
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee && `Recording payment for ${selectedEmployee.employee}`}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Salary</span>
                  <span className="font-medium">${selectedEmployee.totalSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="text-success font-medium">${selectedEmployee.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="text-warning font-medium">${selectedEmployee.remainingAmount.toLocaleString()}</span>
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
                  max={selectedEmployee.remainingAmount}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Payment Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
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
