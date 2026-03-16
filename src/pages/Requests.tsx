import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

type CorrectionRequest = {
  id: string;
  user_id: string;
  request_date: string;
  request_type: string;
  note: string | null;
  status: string;
  created_at: string;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

const statusStyles: Record<string, string> = {
  pending: "status-pending",
  approved: "status-completed",
  rejected: "status-absent",
};

export default function RequestsPage() {
  const { role, user } = useAuth();
  const { t } = useTranslation();
  const isAdmin = role === "admin";
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);
    let query = supabase.from("correction_requests").select("*").order("created_at", { ascending: false });
    if (!isAdmin) query = query.eq("user_id", user.id);
    const [reqRes, profRes] = await Promise.all([
      query,
      isAdmin ? supabase.from("profiles").select("user_id, full_name, email") : Promise.resolve({ data: [] }),
    ]);
    setRequests(reqRes.data || []);
    setProfiles(profRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [user, isAdmin]);

  const getName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || userId.slice(0, 8) + "...";
  };

  const handleAction = async (req: CorrectionRequest, status: "approved" | "rejected") => {
    const { error } = await supabase.from("correction_requests").update({ status }).eq("id", req.id);
    if (error) {
      toast({ title: t("requests.updateFailed"), description: error.message, variant: "destructive" });
      return;
    }
    if (status === "approved") await applyCorrection(req);
    toast({ title: status === "approved" ? t("requests.requestApproved") : t("requests.requestRejected") });
    fetchRequests();
  };

  const applyCorrection = async (req: CorrectionRequest) => {
    const { data: existing } = await supabase.from("attendance_records").select("id").eq("user_id", req.user_id).eq("date", req.request_date).maybeSingle();
    if (req.request_type === "missing_day" || req.request_type === "missing_check_in") {
      if (!existing) {
        const { error } = await supabase.from("attendance_records").insert({ user_id: req.user_id, date: req.request_date, check_in_time: new Date(`${req.request_date}T09:00:00`).toISOString(), status: "checked_in", break_duration_ms: 0 });
        if (error) toast({ title: t("requests.warning"), description: error.message, variant: "destructive" });
      }
    } else if (req.request_type === "missing_check_out") {
      if (existing) {
        const { error } = await supabase.from("attendance_records").update({ check_out_time: new Date(`${req.request_date}T17:00:00`).toISOString(), status: "completed" }).eq("id", existing.id);
        if (error) toast({ title: t("requests.warning"), description: error.message, variant: "destructive" });
      } else {
        const { error } = await supabase.from("attendance_records").insert({ user_id: req.user_id, date: req.request_date, check_in_time: new Date(`${req.request_date}T09:00:00`).toISOString(), check_out_time: new Date(`${req.request_date}T17:00:00`).toISOString(), status: "completed", break_duration_ms: 0 });
        if (error) toast({ title: t("requests.warning"), description: error.message, variant: "destructive" });
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? t("requests.title") : t("requests.myRequests")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{isAdmin ? t("requests.subtitle") : t("requests.mySubtitle")}</p>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">{t("loading")}</p>
        ) : requests.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">{t("requests.noRequests")}</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>{t("requests.employee")}</th>}
                <th>{t("requests.type")}</th>
                <th>{t("requests.date")}</th>
                <th>{t("requests.note")}</th>
                <th>{t("requests.status")}</th>
                {isAdmin && <th>{t("actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  {isAdmin && <td className="font-medium">{getName(r.user_id)}</td>}
                  <td>{r.request_type.replace(/_/g, " ")}</td>
                  <td className="mono">{r.request_date}</td>
                  <td className="max-w-xs truncate text-muted-foreground">{r.note || "—"}</td>
                  <td>
                    <span className={`status-badge ${statusStyles[r.status] || "status-pending"}`}>
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  {isAdmin && (
                    <td>
                      {r.status === "pending" ? (
                        <div className="flex gap-1.5">
                          <Button size="sm" onClick={() => handleAction(r, "approved")}>{t("requests.approve")}</Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r, "rejected")}>{t("requests.reject")}</Button>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
