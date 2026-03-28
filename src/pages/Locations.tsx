import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MapPin, Plus, Pencil, Trash2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type Profile = { user_id: string; full_name: string | null; email: string | null };

type LocationEmployee = { user_id: string };

type Location = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  assigned_employees: number;
  start_date: string | null;
  end_date: string | null;
};

export default function LocationsPage() {
  const { role } = useAuth();
  const { t } = useTranslation();
  const isAdmin = role === "admin";
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [locationEmployees, setLocationEmployees] = useState<Record<string, string[]>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState("200");
  const [formStartDate, setFormStartDate] = useState<Date | undefined>();
  const [formEndDate, setFormEndDate] = useState<Date | undefined>();
  const [formSelectedEmployees, setFormSelectedEmployees] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    const [{ data: locs }, { data: le }] = await Promise.all([
      supabase.from("locations").select("*").order("created_at", { ascending: false }),
      supabase.from("location_employees" as any).select("location_id, user_id"),
    ]);
    setLocations((locs as Location[]) || []);
    // Group employees by location
    const map: Record<string, string[]> = {};
    ((le as any[]) || []).forEach((r: any) => {
      if (!map[r.location_id]) map[r.location_id] = [];
      map[r.location_id].push(r.user_id);
    });
    setLocationEmployees(map);
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name, email");
    setEmployees(data || []);
  };

  useEffect(() => { fetchLocations(); fetchEmployees(); }, []);

  const openAdd = () => {
    setEditing(null); setFormName(""); setFormAddress(""); setFormLat(""); setFormLng("");
    setFormRadius("200"); setFormStartDate(undefined); setFormEndDate(undefined);
    setFormSelectedEmployees([]); setModalOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc); setFormName(loc.name); setFormAddress(loc.address || "");
    setFormLat(loc.latitude?.toString() || ""); setFormLng(loc.longitude?.toString() || "");
    setFormRadius(loc.radius_meters.toString());
    setFormStartDate(loc.start_date ? new Date(loc.start_date) : undefined);
    setFormEndDate(loc.end_date ? new Date(loc.end_date) : undefined);
    setFormSelectedEmployees(locationEmployees[loc.id] || []);
    setModalOpen(true);
  };

  const toggleEmployee = (userId: string) => {
    setFormSelectedEmployees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    if (!formName) return;
    if (formStartDate && formEndDate && formStartDate >= formEndDate) {
      toast({ title: t("locations.invalidDates"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload: any = {
      name: formName, address: formAddress || null,
      latitude: formLat ? parseFloat(formLat) : null,
      longitude: formLng ? parseFloat(formLng) : null,
      radius_meters: parseInt(formRadius) || 200,
      assigned_employees: formSelectedEmployees.length,
      start_date: formStartDate ? format(formStartDate, "yyyy-MM-dd") : null,
      end_date: formEndDate ? format(formEndDate, "yyyy-MM-dd") : null,
    };

    let locationId: string | null = null;

    if (editing) {
      const { error } = await supabase.from("locations").update(payload).eq("id", editing.id);
      if (error) { toast({ title: t("locations.updateFailed"), description: error.message, variant: "destructive" }); setSaving(false); return; }
      locationId = editing.id;
      toast({ title: t("locations.locationUpdated") });
    } else {
      const { data, error } = await supabase.from("locations").insert(payload).select("id").single();
      if (error || !data) { toast({ title: t("locations.addFailed"), description: error?.message, variant: "destructive" }); setSaving(false); return; }
      locationId = data.id;
      toast({ title: t("locations.locationAdded") });
    }

    // Sync employee assignments
    if (locationId) {
      await supabase.from("location_employees" as any).delete().eq("location_id", locationId);
      if (formSelectedEmployees.length > 0) {
        const rows = formSelectedEmployees.map((uid) => ({ location_id: locationId!, user_id: uid }));
        await supabase.from("location_employees" as any).insert(rows);
      }
    }

    setSaving(false); setModalOpen(false); fetchLocations();
  };

  const handleDelete = async (loc: Location) => {
    if (!confirm(t("locations.deleteConfirm", { name: loc.name }))) return;
    const { error } = await supabase.from("locations").delete().eq("id", loc.id);
    toast(error ? { title: t("locations.deleteFailed"), description: error.message, variant: "destructive" } : { title: t("locations.locationDeleted") });
    if (!error) fetchLocations();
  };

  const getEmployeeNames = (locId: string) => {
    const ids = locationEmployees[locId] || [];
    return ids.map((uid) => {
      const emp = employees.find((e) => e.user_id === uid);
      return emp?.full_name || emp?.email || uid.slice(0, 8);
    });
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t("locations.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("locations.subtitle")}</p>
        </div>
        {isAdmin && <Button onClick={openAdd}><Plus className="h-4 w-4 mr-1.5" /> {t("locations.addLocation")}</Button>}
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">{t("loading")}</p>
        ) : locations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            {t("locations.noLocations")} {isAdmin ? t("locations.noLocationsAdmin") : ""}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("locations.location")}</th>
                <th>{t("locations.address")}</th>
                <th>{t("locations.startDate")}</th>
                <th>{t("locations.endDate")}</th>
                <th>{t("locations.employeesCol")}</th>
                {isAdmin && <th>{t("actions")}</th>}
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => {
                const empNames = getEmployeeNames(l.id);
                return (
                  <tr key={l.id}>
                    <td><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-accent" /><span className="font-medium">{l.name}</span></div></td>
                    <td className="text-muted-foreground">{l.address || "—"}</td>
                    <td className="text-muted-foreground">{l.start_date || "—"}</td>
                    <td className="text-muted-foreground">{l.end_date || "—"}</td>
                    <td>
                      {empNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {empNames.map((name, i) => (
                            <span key={i} className="inline-block text-xs bg-accent/20 text-accent-foreground rounded px-1.5 py-0.5">{name}</span>
                          ))}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    {isAdmin && (
                      <td>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(l)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("locations.editLocation") : t("locations.addLocation")}</DialogTitle>
            <DialogDescription>{editing ? t("locations.updateDetails") : t("locations.createZone")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>{t("locations.name")}</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Main Office" /></div>
            <div className="space-y-2"><Label>{t("locations.address")}</Label><Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="123 Main St, City" /></div>

            {/* Date pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t("locations.startDate")}</Label>
                <Input
                  type="date"
                  value={formStartDate ? format(formStartDate, "yyyy-MM-dd") : ""}
                  onChange={(e) => setFormStartDate(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("locations.endDate")}</Label>
                <Input
                  type="date"
                  value={formEndDate ? format(formEndDate, "yyyy-MM-dd") : ""}
                  min={formStartDate ? format(formStartDate, "yyyy-MM-dd") : undefined}
                  onChange={(e) => setFormEndDate(e.target.value ? new Date(e.target.value + "T00:00:00") : undefined)}
                />
              </div>
            </div>

            {/* Employee multi-select */}
            <div className="space-y-2">
              <Label>{t("locations.assignedEmployees")} ({formSelectedEmployees.length})</Label>
              <div className="border rounded-md">
                <ScrollArea className="h-40">
                  <div className="p-2 space-y-1">
                    {employees.map((emp) => (
                      <label key={emp.user_id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/10 cursor-pointer text-sm">
                        <Checkbox
                          checked={formSelectedEmployees.includes(emp.user_id)}
                          onCheckedChange={() => toggleEmployee(emp.user_id)}
                        />
                        <span>{emp.full_name || emp.email || emp.user_id.slice(0, 8)}</span>
                      </label>
                    ))}
                    {employees.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">{t("employees.noEmployees")}</p>}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>{t("cancel")}</Button>
            <Button onClick={handleSave} disabled={saving || !formName}>{saving ? t("locations.saving") : editing ? t("employees.saveChanges") : t("locations.addLocation")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
