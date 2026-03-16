import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";

const reportTypes = [
  { title: "Daily Attendance Report", description: "Attendance records for a specific day including check-in/out times and breaks", icon: FileText },
  { title: "Monthly Attendance Report", description: "Full monthly attendance summary for all employees by company", icon: FileText },
  { title: "Payroll Report", description: "Detailed payroll calculations including hours worked, rates, and totals", icon: FileText },
  { title: "Working Hours Report", description: "Individual employee working hours breakdown with overtime tracking", icon: FileText },
];

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Generate and export reports</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reportTypes.map((report, i) => (
          <div key={i} className="rounded-md border bg-card p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-md bg-muted p-2.5">
                <report.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">{report.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{report.description}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">
                    <Download className="h-3.5 w-3.5 mr-1" /> PDF
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-3.5 w-3.5 mr-1" /> Excel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
