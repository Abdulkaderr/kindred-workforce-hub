import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export type WeekSummary = {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  totalHours: number;
  totalSalary: number;
  paid: number;
  remaining: number;
  status: "Betaald" | "Deels" | "Openstaand";
  payrollId: string | null;
};

type Props = {
  employeeName: string;
  weeks: WeekSummary[];
  onSelectWeek: (week: WeekSummary) => void;
  onBack: () => void;
};

export function WeekList({ employeeName, weeks, onSelectWeek, onBack }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Terug
        </Button>
        <h2 className="text-lg font-semibold">{employeeName} — Weken</h2>
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
                <th>Week</th>
                <th>Uren</th>
                <th>Salaris</th>
                <th>Betaald</th>
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
                  <td className="font-medium">{w.weekLabel}</td>
                  <td className="mono">{w.totalHours.toFixed(1)}</td>
                  <td className="mono font-medium">€{w.totalSalary.toLocaleString()}</td>
                  <td className="mono text-success">€{w.paid.toLocaleString()}</td>
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
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
