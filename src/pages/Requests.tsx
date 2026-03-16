import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
  const isAdmin = role === "admin";
  const [requests, setRequests] = useState<CorrectionRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("correction_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const [reqRes, profRes] = await Promise.all([
      query,
      isAdmin ? supabase.from("profiles").select("user_id, full_name, email") : Promise.resolve({ data: [] }),
    ]);

    setRequests(reqRes.data || []);
    setProfiles(profRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [user, isAdmin]);

  const getName = (userId: string) => {
    const p = profiles.find((p) => p.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || userId.slice(0, 8) + "...";
  };

  const handleAction = async (req: CorrectionRequest, status: "approved" | "rejected") => {
    // Update the correction request status
    const { error } = await supabase
      .from("correction_requests")
      .update({ status })
      .eq("id", req.id);

    if (error) {
      toast({ title: "Failed to update request", description: error.message, variant: "destructive" });
      return;
    }

    // If approved, create/update the attendance record
    if (status === "approved") {
      await applyCorrection(req);
    }

    toast({ title: `Request ${status}` });
    fetchRequests();
  };

  /** Apply an approved correction request to the attendance_records table */
  const applyCorrection = async (req: CorrectionRequest) => {
    const requestDate = req.request_date;
    const userId = req.user_id;

    // Check if an attendance record already exists for this user+date
    const { data: existing } = await supabase
      .from("attendance_records")
      .select("id")
      .eq("user_id", userId)
      .eq("date", requestDate)
      .maybeSingle();

    if (req.request_type === "missing_day" || req.request_type === "missing_check_in") {
      if (!existing) {
        // Create a new attendance record for the missing day
        const now = new Date(`${requestDate}T09:00:00`).toISOString();
        const { error } = await supabase.from("attendance_records").insert({
          user_id: userId,
          date: requestDate,
          check_in_time: now,
          status: "checked_in",
          break_duration_ms: 0,
        });
        if (error) {
          toast({ title: "Warning", description: "Correction approved but failed to create attendance record: " + error.message, variant: "destructive" });
        }
      }
    } else if (req.request_type === "missing_check_out") {
      if (existing) {
        // Set a default check-out time
        const endOfDay = new Date(`${requestDate}T17:00:00`).toISOString();
        const { error } = await supabase
          .from("attendance_records")
          .update({ check_out_time: endOfDay, status: "completed" })
          .eq("id", existing.id);
        if (error) {
          toast({ title: "Warning", description: "Correction approved but failed to update attendance: " + error.message, variant: "destructive" });
        }
      } else {
        // Create full record with default times
        const { error } = await supabase.from("attendance_records").insert({
          user_id: userId,
          date: requestDate,
          check_in_time: new Date(`${requestDate}T09:00:00`).toISOString(),
          check_out_time: new Date(`${requestDate}T17:00:00`).toISOString(),
          status: "completed",
          break_duration_ms: 0,
        });
        if (error) {
          toast({ title: "Warning", description: "Correction approved but failed to create attendance record: " + error.message, variant: "destructive" });
        }
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">{isAdmin ? "Requests" : "My Requests"}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAdmin ? "Employee correction requests" : "Your submitted correction requests"}
          </p>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : requests.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">No correction requests found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {isAdmin && <th>Employee</th>}
                <th>Type</th>
                <th>Date</th>
                <th>Note</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
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
                          <Button size="sm" onClick={() => handleAction(r, "approved")}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r, "rejected")}>Reject</Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
