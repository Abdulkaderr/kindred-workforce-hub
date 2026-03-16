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

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("correction_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({ title: "Failed to update request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Request ${status}` });
      fetchRequests();
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

      <div className="rounded-md border bg-card shadow-sm">
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
                          <Button size="sm" onClick={() => handleAction(r.id, "approved")}>Approve</Button>
                          <Button size="sm" variant="outline" onClick={() => handleAction(r.id, "rejected")}>Reject</Button>
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
