import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import type { WeekSummary } from "./WeekList";

export type DayDetail = {
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  breakMs: number;
  hours: number;
  salary: number;
  projectName: string;
};

type Props = {
  employeeName: string;
  week: WeekSummary;
  days: DayDetail[];
  rate: number;
  onBack: () => void;
  onPayment: (amount: number) => Promise<void>;
  isAdmin: boolean;
};

export function WeekDetails({ employeeName, week, days, rate, onBack, onPayment, isAdmin }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"full" | "partial">("full");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openPayment = (type: "full" | "partial") => {
    setModalType(type);
    setAmount(type === "full" ? week.remaining.toString() : "");
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const val = Number(amount);
    if (val <= 0) return;
    setSubmitting(true);
    await onPayment(val);
    setSubmitting(false);
    setModalOpen(false);
  };

  const formatTime = (t: string | null) => {
    if (!t) return "-";
    return new Date(t).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" });
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <h2 className="text-lg font-semibold">{employeeName} — {week.weekLabel}</h2>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="rounded-md border bg-card p-3">
          <p className="text-xs text-muted-foreground">Uurloon</p>
          <p className="text-lg font-semibold">€{rate}/u</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-xs text-muted-foreground">Totale Uren</p>
          <p className="text-lg font-semibold">{week.totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-xs text-muted-foreground">Totaal Salaris</p>
          <p className="text-lg font-semibold">€{week.totalSalary.toLocaleString()}</p>
        </div>
        <div className="rounded-md border bg-card p-3">
          <p className="text-xs text-muted-foreground">Resterend</p>
          <p className={`text-lg font-semibold ${week.remaining > 0 ? "text-warning" : "text-success"}`}>
            €{week.remaining.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Daily breakdown */}
      <div className="rounded-md border bg-card shadow-sm overflow-x-auto mb-6">
        <table className="data-table">
          <thead>
            <tr>
              <th>Dag</th>
              <th>Project</th>
              <th>In</th>
              <th>Uit</th>
              <th>Pauze</th>
              <th>Uren</th>
              <th>Salaris</th>
            </tr>
          </thead>
          <tbody>
            {days.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted-foreground py-4">
                  Geen gegevens voor deze week.
                </td>
              </tr>
            ) : (
              days.map((d) => (
                <tr key={d.date}>
                  <td className="font-medium">{formatDate(d.date)}</td>
                  <td>{d.projectName}</td>
                  <td className="mono">{formatTime(d.checkIn)}</td>
                  <td className="mono">{formatTime(d.checkOut)}</td>
                  <td className="mono">{Math.round(d.breakMs / 60000)}m</td>
                  <td className="mono">{d.hours.toFixed(1)}</td>
                  <td className="mono font-medium">€{d.salary.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payment buttons */}
      {isAdmin && week.remaining > 0 && (
        <div className="flex gap-3">
          <Button onClick={() => openPayment("full")}>Volledig Betalen (€{week.remaining.toLocaleString()})</Button>
          <Button variant="outline" onClick={() => openPayment("partial")}>Deelbetaling</Button>
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalType === "full" ? "Volledig Betalen" : "Deelbetaling"}</DialogTitle>
            <DialogDescription>
              Betaling voor {employeeName} — {week.weekLabel}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Week Salaris</span>
                <span className="font-medium">€{week.totalSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Al Betaald</span>
                <span className="text-success font-medium">€{week.paid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resterend</span>
                <span className="text-warning font-medium">€{week.remaining.toLocaleString()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Bedrag</Label>
              <Input
                id="pay-amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Annuleren</Button>
            <Button onClick={handleSubmit} disabled={!amount || Number(amount) <= 0 || submitting}>
              {submitting ? "Bezig..." : "Bevestigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
