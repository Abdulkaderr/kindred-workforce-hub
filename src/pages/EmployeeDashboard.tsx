import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import {
  LogIn,
  LogOut,
  Coffee,
  Timer,
  Clock,
  FileWarning,
  Send,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Employee";

  const [checkedIn, setCheckedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [breakStart, setBreakStart] = useState<number | null>(null);
  const [totalBreakMs, setTotalBreakMs] = useState(0);

  // Correction request state
  const [reqDate, setReqDate] = useState("");
  const [reqType, setReqType] = useState("");
  const [reqNote, setReqNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const now = () =>
    new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const handleCheckIn = () => {
    setCheckInTime(now());
    setCheckOutTime(null);
    setTotalBreakMs(0);
    setCheckedIn(true);
  };

  const handleCheckOut = () => {
    setCheckOutTime(now());
    setCheckedIn(false);
    if (onBreak && breakStart) {
      setTotalBreakMs((prev) => prev + (Date.now() - breakStart));
    }
    setOnBreak(false);
    setBreakStart(null);
  };

  const handleBreakToggle = () => {
    if (onBreak && breakStart) {
      setTotalBreakMs((prev) => prev + (Date.now() - breakStart));
      setBreakStart(null);
    } else {
      setBreakStart(Date.now());
    }
    setOnBreak(!onBreak);
  };

  const formatBreak = (ms: number) => {
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleSubmitRequest = async () => {
    if (!reqDate || !reqType) {
      toast({ title: "Please fill in the date and request type", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("correction_requests").insert({
      user_id: user!.id,
      request_date: reqDate,
      request_type: reqType,
      note: reqNote || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "Failed to submit request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted", description: "Your admin will review it shortly." });
      setReqDate("");
      setReqType("");
      setReqNote("");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-md w-full space-y-6 py-2">
        {/* Greeting */}
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            Hello, {displayName} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Today Status */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> Today's Status
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Check In
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground mono">
                {checkInTime || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Check Out
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground mono">
                {checkOutTime || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Break
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground mono">
                {totalBreakMs > 0 || onBreak
                  ? formatBreak(
                      totalBreakMs +
                        (onBreak && breakStart ? Date.now() - breakStart : 0)
                    )
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Attendance Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {/* Check In */}
          <button
            onClick={handleCheckIn}
            disabled={checkedIn}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 p-6 transition-all hover:bg-primary/10 hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="rounded-full bg-primary p-3">
              <LogIn className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Check In
            </span>
          </button>

          {/* Check Out */}
          <button
            onClick={handleCheckOut}
            disabled={!checkedIn}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-destructive/20 bg-destructive/5 p-6 transition-all hover:bg-destructive/10 hover:border-destructive/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="rounded-full bg-destructive p-3">
              <LogOut className="h-6 w-6 text-destructive-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Check Out
            </span>
          </button>

          {/* Start Break */}
          <button
            onClick={handleBreakToggle}
            disabled={!checkedIn || onBreak}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-warning/20 bg-warning/5 p-6 transition-all hover:bg-warning/10 hover:border-warning/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="rounded-full bg-warning p-3">
              <Coffee className="h-6 w-6 text-warning-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Start Break
            </span>
          </button>

          {/* End Break */}
          <button
            onClick={handleBreakToggle}
            disabled={!onBreak}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-success/20 bg-success/5 p-6 transition-all hover:bg-success/10 hover:border-success/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
          >
            <div className="rounded-full bg-success p-3">
              <Timer className="h-6 w-6 text-success-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              End Break
            </span>
          </button>
        </div>

        {/* Live indicator */}
        {checkedIn && (
          <div className="flex items-center justify-center gap-2 text-sm text-success font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            {onBreak ? "On Break" : "Currently Working"}
          </div>
        )}

        {/* Correction Request */}
        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileWarning className="h-3.5 w-3.5" /> Request Correction
          </h2>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={reqDate}
                onChange={(e) => setReqDate(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Request Type</Label>
              <Select value={reqType} onValueChange={setReqType}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing_check_in">Missing Check In</SelectItem>
                  <SelectItem value="missing_check_out">Missing Check Out</SelectItem>
                  <SelectItem value="fill_missing_day">Fill Missing Day</SelectItem>
                  <SelectItem value="correct_record">Correct Record</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Note (optional)</Label>
              <Textarea
                value={reqNote}
                onChange={(e) => setReqNote(e.target.value)}
                placeholder="Explain what happened..."
                className="min-h-[70px] resize-none"
              />
            </div>

            <Button
              onClick={handleSubmitRequest}
              disabled={submitting}
              className="w-full h-11 gap-2"
            >
              {submitting ? (
                "Submitting..."
              ) : (
                <>
                  <Send className="h-4 w-4" /> Submit Request
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
