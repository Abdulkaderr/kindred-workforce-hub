import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";

const requests = [
  { id: 1, employee: "Sarah Johnson", company: "Acme Corp", type: "Time Correction", description: "Forgot to check out on March 10, left at 5:30 PM", date: "2026-03-11", status: "pending" },
  { id: 2, employee: "Mike Chen", company: "Acme Corp", type: "Time Correction", description: "System error during check-in, actual time was 8:00 AM", date: "2026-03-12", status: "pending" },
  { id: 3, employee: "Lisa Park", company: "TechFlow Inc", type: "Break Correction", description: "Break was only 15 min, recorded as 45 min", date: "2026-03-10", status: "approved" },
  { id: 4, employee: "James Wilson", company: "BuildRight Co", type: "Time Correction", description: "GPS issue prevented check-in, was at location", date: "2026-03-13", status: "rejected" },
];

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  approved: "status-completed",
  rejected: "status-absent",
};

export default function RequestsPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Employee correction requests</p>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Company</th>
              <th>Type</th>
              <th>Description</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.employee}</td>
                <td className="text-muted-foreground">{r.company}</td>
                <td>{r.type}</td>
                <td className="max-w-xs truncate text-muted-foreground">{r.description}</td>
                <td className="mono">{r.date}</td>
                <td>
                  <span className={`status-badge ${statusStyles[r.status]}`}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </td>
                <td>
                  {r.status === "pending" ? (
                    <div className="flex gap-1.5">
                      <Button size="sm">Approve</Button>
                      <Button size="sm" variant="outline">Reject</Button>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
