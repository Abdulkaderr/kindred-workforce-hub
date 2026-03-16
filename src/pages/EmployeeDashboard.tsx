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
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Employee";

  const [checkedIn, setCheckedIn] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [breakStart, setBreakStart] = useState<number | null>(null);
  const [totalBreakMs, setTotalBreakMs] = useState(0);
  const [recordId, setRecordId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setRecordId(data.id);
          if (data.check_in_time) {
            setCheckInTime(
              new Date(data.check_in_time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            );
          }
          if (data.check_out_time) {
            setCheckOutTime(
              new Date(data.check_out_time).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })
            );
          } else if (data.check_in_time) {
            setCheckedIn(true);
          }
          setTotalBreakMs(Number(data.break_duration_ms) || 0);
        }
      });
  }, [user]);

  const handleCheckIn = async () => {
    if (!user) return;
    const timestamp = new Date().toISOString();
    setCheckInTime(now());
    setCheckOutTime(null);
    setTotalBreakMs(0);
    setCheckedIn(true);

    const { data, error } = await supabase
      .from("attendance_records")
      .upsert(
        {
          user_id: user.id,
          date: new Date().toISOString().split("T")[0],
          check_in_time: timestamp,
          check_out_time: null,
          break_duration_ms: 0,
          status: "checked_in",
        },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    if (error) {
      toast({ title: t("employeeDashboard.checkInFailed"), description: error.message, variant: "destructive" });
    } else if (data) {
      setRecordId(data.id);
    }
  };

  const handleCheckOut = async () => {
    const finalBreak =
      totalBreakMs + (onBreak && breakStart ? Date.now() - breakStart : 0);
    setCheckOutTime(now());
    setCheckedIn(false);
    setOnBreak(false);
    setBreakStart(null);
    setTotalBreakMs(finalBreak);

    if (recordId) {
      const { error } = await supabase
        .from("attendance_records")
        .update({
          check_out_time: new Date().toISOString(),
          break_duration_ms: finalBreak,
          status: "completed",
        })
        .eq("id", recordId);

      if (error) {
        toast({ title: t("employeeDashboard.checkOutFailed"), description: error.message, variant: "destructive" });
      }
    }
  };

  const handleBreakToggle = async () => {
    if (onBreak && breakStart) {
      const newTotal = totalBreakMs + (Date.now() - breakStart);
      setTotalBreakMs(newTotal);
      setBreakStart(null);
      setOnBreak(false);

      if (recordId) {
        await supabase
          .from("attendance_records")
          .update({ break_duration_ms: newTotal, status: "checked_in" })
          .eq("id", recordId);
      }
    } else {
      setBreakStart(Date.now());
      setOnBreak(true);

      if (recordId) {
        await supabase
          .from("attendance_records")
          .update({ status: "on_break" })
          .eq("id", recordId);
      }
    }
  };

  const formatBreak = (ms: number) => {
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleSubmitRequest = async () => {
    if (!reqDate || !reqType) {
      toast({ title: t("employeeDashboard.fillDateAndType"), variant: "destructive" });
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
      toast({ title: t("employeeDashboard.requestFailed"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("employeeDashboard.requestSubmitted"), description: t("employeeDashboard.requestSubmittedDesc") });
      setReqDate("");
      setReqType("");
      setReqNote("");
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-md w-full space-y-6 py-2">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">
            {t("employeeDashboard.hello", { name: displayName })}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {t("employeeDashboard.todayStatus")}
          </h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("employeeDashboard.checkIn")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground mono">{checkInTime || "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("employeeDashboard.checkOut")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground mono">{checkOutTime || "—"}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("employeeDashboard.break")}</p>
              <p className="mt-1 text-sm font-semibold text-foreground mono">
                {totalBreakMs > 0 || onBreak
                  ? formatBreak(totalBreakMs + (onBreak && breakStart ? Date.now() - breakStart : 0))
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleCheckIn} disabled={checkedIn}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 p-6 transition-all hover:bg-primary/10 hover:border-primary/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
            <div className="rounded-full bg-primary p-3"><LogIn className="h-6 w-6 text-primary-foreground" /></div>
            <span className="text-sm font-semibold text-foreground">{t("employeeDashboard.checkIn")}</span>
          </button>
          <button onClick={handleCheckOut} disabled={!checkedIn}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-destructive/20 bg-destructive/5 p-6 transition-all hover:bg-destructive/10 hover:border-destructive/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
            <div className="rounded-full bg-destructive p-3"><LogOut className="h-6 w-6 text-destructive-foreground" /></div>
            <span className="text-sm font-semibold text-foreground">{t("employeeDashboard.checkOut")}</span>
          </button>
          <button onClick={handleBreakToggle} disabled={!checkedIn || onBreak}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-warning/20 bg-warning/5 p-6 transition-all hover:bg-warning/10 hover:border-warning/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
            <div className="rounded-full bg-warning p-3"><Coffee className="h-6 w-6 text-warning-foreground" /></div>
            <span className="text-sm font-semibold text-foreground">{t("employeeDashboard.startBreak")}</span>
          </button>
          <button onClick={handleBreakToggle} disabled={!onBreak}
            className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-success/20 bg-success/5 p-6 transition-all hover:bg-success/10 hover:border-success/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95">
            <div className="rounded-full bg-success p-3"><Timer className="h-6 w-6 text-success-foreground" /></div>
            <span className="text-sm font-semibold text-foreground">{t("employeeDashboard.endBreak")}</span>
          </button>
        </div>

        {checkedIn && (
          <div className="flex items-center justify-center gap-2 text-sm text-success font-medium">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
            </span>
            {onBreak ? t("employeeDashboard.onBreak") : t("employeeDashboard.currentlyWorking")}
          </div>
        )}

        <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileWarning className="h-3.5 w-3.5" /> {t("employeeDashboard.requestCorrection")}
          </h2>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t("employeeDashboard.date")}</Label>
              <Input type="date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("employeeDashboard.requestType")}</Label>
              <Select value={reqType} onValueChange={setReqType}>
                <SelectTrigger className="h-11"><SelectValue placeholder={t("employeeDashboard.selectType")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="missing_check_in">{t("employeeDashboard.missingCheckIn")}</SelectItem>
                  <SelectItem value="missing_check_out">{t("employeeDashboard.missingCheckOut")}</SelectItem>
                  <SelectItem value="fill_missing_day">{t("employeeDashboard.fillMissingDay")}</SelectItem>
                  <SelectItem value="correct_record">{t("employeeDashboard.correctRecord")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t("employeeDashboard.note")}</Label>
              <Textarea value={reqNote} onChange={(e) => setReqNote(e.target.value)} placeholder={t("employeeDashboard.notePlaceholder")} className="min-h-[70px] resize-none" />
            </div>
            <Button onClick={handleSubmitRequest} disabled={submitting} className="w-full h-11 gap-2">
              {submitting ? t("employeeDashboard.submitting") : <><Send className="h-4 w-4" /> {t("employeeDashboard.submitRequest")}</>}
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
