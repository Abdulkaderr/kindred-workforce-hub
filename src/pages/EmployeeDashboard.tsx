import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, CalendarDays, DollarSign, Coffee, PlayCircle, StopCircle, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const attendanceHistory = [
  { date: "2026-03-16", checkIn: "08:02", checkOut: "17:05", breakTime: "0:30", totalHours: "8:33", status: "completed" },
  { date: "2026-03-15", checkIn: "08:10", checkOut: "17:00", breakTime: "0:30", totalHours: "8:20", status: "completed" },
  { date: "2026-03-14", checkIn: "07:55", checkOut: "17:01", breakTime: "1:00", totalHours: "8:06", status: "completed" },
  { date: "2026-03-13", checkIn: "08:30", checkOut: "17:15", breakTime: "0:45", totalHours: "8:00", status: "completed" },
  { date: "2026-03-12", checkIn: "09:15", checkOut: "17:00", breakTime: "0:30", totalHours: "7:15", status: "late" },
];

const paymentHistory = [
  { period: "March 2026", hours: 120.5, rate: 45, amount: 5422.5, status: "pending" },
  { period: "February 2026", hours: 176.0, rate: 45, amount: 7920, status: "paid" },
  { period: "January 2026", hours: 168.0, rate: 45, amount: 7560, status: "paid" },
];

const statusStyles: Record<string, string> = {
  completed: "status-completed",
  late: "status-late",
  working: "status-active",
  paid: "status-completed",
  pending: "status-pending",
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Employee";

  const [checkedIn, setCheckedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const handleCheckIn = () => {
    const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
    setCheckInTime(now);
    setCheckedIn(true);
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    setOnBreak(false);
    setCheckInTime(null);
  };

  const totalHoursThisMonth = 120.5;
  const totalDaysThisMonth = 15;
  const salaryThisMonth = 5422.5;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {displayName}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Your attendance and salary overview</p>
        </div>
        <p className="mono text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Check-In / Check-Out Controls */}
      <div className="rounded-md border bg-card shadow-sm p-5 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Today's Status</h2>
            {checkedIn ? (
              <p className="text-sm text-muted-foreground mt-1">
                Checked in at <span className="mono font-medium text-success">{checkInTime}</span>
                {onBreak && <span className="ml-2 text-warning font-medium">• On Break</span>}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mt-1">You haven't checked in yet</p>
            )}
          </div>
          <div className="flex gap-2">
            {!checkedIn ? (
              <Button onClick={handleCheckIn} className="gap-2">
                <PlayCircle className="h-4 w-4" /> Check In
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setOnBreak(!onBreak)}
                  className="gap-2"
                >
                  {onBreak ? <Timer className="h-4 w-4" /> : <Coffee className="h-4 w-4" />}
                  {onBreak ? "End Break" : "Start Break"}
                </Button>
                <Button variant="destructive" onClick={handleCheckOut} className="gap-2">
                  <StopCircle className="h-4 w-4" /> Check Out
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard title="Hours This Month" value={totalHoursThisMonth.toFixed(1)} icon={Clock} variant="default" />
        <StatCard title="Days Worked" value={totalDaysThisMonth} icon={CalendarDays} variant="accent" />
        <StatCard title="Salary This Month" value={`$${salaryThisMonth.toLocaleString()}`} icon={DollarSign} variant="success" />
        <StatCard title="Hourly Rate" value="$45/hr" icon={DollarSign} variant="warning" />
      </div>

      {/* Attendance History */}
      <div className="rounded-md border bg-card shadow-sm mb-6">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" /> Recent Attendance
          </h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Break</th>
              <th>Total Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendanceHistory.map((a, i) => (
              <tr key={i}>
                <td className="mono">{a.date}</td>
                <td className="mono">{a.checkIn}</td>
                <td className="mono">{a.checkOut}</td>
                <td className="mono">{a.breakTime}</td>
                <td className="mono font-medium">{a.totalHours}</td>
                <td>
                  <span className={`status-badge ${statusStyles[a.status]}`}>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Payment History */}
      <div className="rounded-md border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" /> Payment History
          </h2>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((p, i) => (
              <tr key={i}>
                <td className="font-medium">{p.period}</td>
                <td className="mono">{p.hours.toFixed(1)}</td>
                <td className="mono">${p.rate}/hr</td>
                <td className="mono font-medium">${p.amount.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${statusStyles[p.status]}`}>
                    {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
