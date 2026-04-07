import { ChevronRight } from "lucide-react";

type EmployeeSummary = {
  user_id: string;
  name: string;
  totalHours: number;
  totalSalary: number;
  totalPaid: number;
  remaining: number;
};

type Props = {
  employees: EmployeeSummary[];
  onSelect: (userId: string) => void;
};

export function EmployeePayrollList({ employees, onSelect }: Props) {
  if (employees.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        Geen medewerkers gevonden.
      </p>
    );
  }

  return (
    <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Medewerker</th>
            <th>Totale Uren</th>
            <th>Totaal Salaris</th>
            <th>Betaald</th>
            <th>Resterend</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => (
            <tr
              key={emp.user_id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => onSelect(emp.user_id)}
            >
              <td className="font-medium">{emp.name}</td>
              <td className="mono">{emp.totalHours.toFixed(1)}</td>
              <td className="mono font-medium">€{emp.totalSalary.toLocaleString()}</td>
              <td className="mono text-success">€{emp.totalPaid.toLocaleString()}</td>
              <td className="mono">
                {emp.remaining > 0 ? (
                  <span className="text-warning">€{emp.remaining.toLocaleString()}</span>
                ) : (
                  "€0"
                )}
              </td>
              <td>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
