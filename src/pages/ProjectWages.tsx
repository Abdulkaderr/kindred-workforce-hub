import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/StatCard";

type AttendanceRow = {
  user_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  break_duration_ms: number;
};

type Profile = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  hourly_rate: number;
};

type Project = {
  id: string;
  name: string;
  location: string;
};

export default function ProjectWagesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!projectId) return;
    setLoading(true);

    const [projRes, attRes, profRes] = await Promise.all([
      supabase.from("projects").select("id, name, location").eq("id", projectId).single(),
      supabase.from("attendance_records").select("user_id, date, check_in_time, check_out_time, break_duration_ms").eq("project_id", projectId),
      supabase.from("profiles").select("user_id, full_name, email, hourly_rate"),
    ]);

    setProject(projRes.data as Project | null);
    setAttendance((attRes.data as AttendanceRow[]) || []);
    setProfiles((profRes.data as Profile[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [projectId]);

  const getName = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.full_name || p?.email?.split("@")[0] || userId.slice(0, 8);
  };

  const getRate = (userId: string) => {
    const p = profiles.find((pr) => pr.user_id === userId);
    return p?.hourly_rate || 0;
  };

  const wageRows = useMemo(() => {
    return attendance
      .filter((a) => a.check_in_time && a.check_out_time)
      .map((a) => {
        const diff = new Date(a.check_out_time!).getTime() - new Date(a.check_in_time!).getTime();
        const hours = Math.max(0, (diff - (a.break_duration_ms || 0)) / 3600000);
        const rate = getRate(a.user_id);
        return {
          name: getName(a.user_id),
          date: a.date,
          location: project?.location || "—",
          checkIn: new Date(a.check_in_time!).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          checkOut: new Date(a.check_out_time!).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
          breakMins: Math.round((a.break_duration_ms || 0) / 60000),
          hours,
          salary: hours * rate,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [attendance, profiles, project]);

  const totalWages = wageRows.reduce((s, r) => s + r.salary, 0);
  const totalHours = wageRows.reduce((s, r) => s + r.hours, 0);

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/projects")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Terug
          </Button>
          <div>
            <h1 className="page-title">{project?.name || "Project"} — Werknemerslonen</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{project?.location || ""}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <StatCard title="Totaal Lonen" value={`€${Math.round(totalWages).toLocaleString()}`} icon={Users} variant="default" />
        <StatCard title="Totaal Uren" value={`${totalHours.toFixed(1)}h`} icon={Users} variant="accent" />
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Laden...</p>
        ) : wageRows.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Geen aanwezigheidsrecords voor dit project.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Medewerker</th>
                <th>Datum</th>
                <th>Projectlocatie</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Pauze</th>
                <th>Totaal Uren</th>
                <th>Totaal Salaris</th>
              </tr>
            </thead>
            <tbody>
              {wageRows.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium">{r.name}</td>
                  <td className="mono">{new Date(r.date).toLocaleDateString("nl-NL", { month: "short", day: "numeric" })}</td>
                  <td>{r.location}</td>
                  <td className="mono">{r.checkIn}</td>
                  <td className="mono">{r.checkOut}</td>
                  <td className="mono">{r.breakMins > 0 ? `${r.breakMins}m` : "—"}</td>
                  <td className="mono">{r.hours.toFixed(1)}</td>
                  <td className="mono">€{r.salary.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </DashboardLayout>
  );
}
