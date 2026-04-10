import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  weekNumber: number;
  totalHours: number;
  totalSalary: number;
  paid: number;
  remaining: number;
  status: "Betaald" | "Deels" | "Openstaand";
  payrollId: string | null;
  paymentDate: string | null;
};

type Props = {
  employeeName: string;
  weeks: WeekSummary[];
  onSelectWeek: (week: WeekSummary) => void;
  onBack: () => void;
  onDeletePayment?: (payrollId: string) => void;
};

export function WeekList({ employeeName, weeks, onSelectWeek, onBack, onDeletePayment }: Props) {
  const totalSalary = weeks.reduce((s, w) => s + w.totalSalary, 0);
  const totalPaid = weeks.reduce((s, w) => s + w.paid, 0);
  const totalRemaining = weeks.reduce((s, w) => s + w.remaining, 0);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <h2 className="text-lg font-semibold">{employeeName} — Weken</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Totaal Salaris</p>
          <p className="text-xl font-semibold">€{totalSalary.toLocaleString()}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Betaald</p>
          <p className="text-xl font-semibold text-success">€{totalPaid.toLocaleString()}</p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs text-muted-foreground">Resterend</p>
          <p className={`text-xl font-semibold ${totalRemaining > 0 ? "text-warning" : "text-success"}`}>€{totalRemaining.toLocaleString()}</p>
        </div>
      </div>

      {weeks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Geen weken met aanwezigheidsgegevens gevonden.
        </p>
      ) : (
        <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Week Nr.</th>
                <th>Periode</th>
                <th>Uren</th>
                <th>Salaris</th>
                <th>Betaald</th>
                <th>Betaaldatum</th>
                <th>Resterend</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {weeks.map((w) => (
                <tr
                  key={w.weekStart}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectWeek(w)}
                >
                  <td className="mono font-medium">{w.weekNumber}</td>
                  <td className="font-medium">{w.weekLabel}</td>
                  <td className="mono">{w.totalHours.toFixed(1)}</td>
                  <td className="mono font-medium">€{w.totalSalary.toLocaleString()}</td>
                  <td className="mono text-success">€{w.paid.toLocaleString()}</td>
                  <td className="mono">{w.paymentDate ? new Date(w.paymentDate + "T00:00:00").toLocaleDateString("nl-NL") : "-"}</td>
                  <td className="mono">
                    {w.remaining > 0 ? (
                      <span className="text-warning">€{w.remaining.toLocaleString()}</span>
                    ) : (
                      "€0"
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        w.status === "Betaald"
                          ? "status-completed"
                          : w.status === "Deels"
                          ? "status-pending"
                          : "status-late"
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      {onDeletePayment && w.payrollId && w.paid > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive h-7 w-7 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePayment(w.payrollId!);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
