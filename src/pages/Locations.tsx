import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Location = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  assigned_employees: number;
};

export default function LocationsPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState("200");
  const [formEmployees, setFormEmployees] = useState("0");
  const [saving, setSaving] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("locations")
      .select("*")
      .order("created_at", { ascending: false });
    setLocations(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setFormName("");
    setFormAddress("");
    setFormLat("");
    setFormLng("");
    setFormRadius("200");
    setFormEmployees("0");
    setModalOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setFormName(loc.name);
    setFormAddress(loc.address || "");
    setFormLat(loc.latitude?.toString() || "");
    setFormLng(loc.longitude?.toString() || "");
    setFormRadius(loc.radius_meters.toString());
    setFormEmployees(loc.assigned_employees.toString());
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!formName) return;
    setSaving(true);

    const payload = {
      name: formName,
      address: formAddress || null,
      latitude: formLat ? parseFloat(formLat) : null,
      longitude: formLng ? parseFloat(formLng) : null,
      radius_meters: parseInt(formRadius) || 200,
      assigned_employees: parseInt(formEmployees) || 0,
    };

    if (editing) {
      const { error } = await supabase.from("locations").update(payload).eq("id", editing.id);
      if (error) {
        toast({ title: "Update failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Location updated" });
      }
    } else {
      const { error } = await supabase.from("locations").insert(payload);
      if (error) {
        toast({ title: "Failed to add location", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Location added" });
      }
    }

    setSaving(false);
    setModalOpen(false);
    fetchLocations();
  };

  const handleDelete = async (loc: Location) => {
    if (!confirm(`Delete location "${loc.name}"?`)) return;
    const { error } = await supabase.from("locations").delete().eq("id", loc.id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Location deleted" });
      fetchLocations();
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header flex-wrap gap-3">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage GPS-verified work zones</p>
        </div>
        {isAdmin && (
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1.5" /> Add Location
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-x-auto">
        {loading ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">Loading...</p>
        ) : locations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground text-center">
            No locations yet. {isAdmin ? "Click 'Add Location' to create one." : ""}
          </p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Address</th>
                <th>Coordinates</th>
                <th>Radius</th>
                <th>Employees</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {locations.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-accent" />
                      <span className="font-medium">{l.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">{l.address || "—"}</td>
                  <td className="mono text-muted-foreground">
                    {l.latitude && l.longitude ? `${l.latitude}, ${l.longitude}` : "—"}
                  </td>
                  <td className="mono">{l.radius_meters}m</td>
                  <td className="mono">{l.assigned_employees}</td>
                  {isAdmin && (
                    <td>
                      <div className="flex gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(l)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Location Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Location" : "Add Location"}</DialogTitle>
            <DialogDescription>{editing ? "Update location details" : "Create a new work zone"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Main Office" />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="123 Main St, City" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Latitude</Label>
                <Input type="number" step="any" value={formLat} onChange={(e) => setFormLat(e.target.value)} placeholder="40.7128" />
              </div>
              <div className="space-y-2">
                <Label>Longitude</Label>
                <Input type="number" step="any" value={formLng} onChange={(e) => setFormLng(e.target.value)} placeholder="-74.0060" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Radius (meters)</Label>
                <Input type="number" value={formRadius} onChange={(e) => setFormRadius(e.target.value)} placeholder="200" />
              </div>
              <div className="space-y-2">
                <Label>Assigned Employees</Label>
                <Input type="number" value={formEmployees} onChange={(e) => setFormEmployees(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !formName}>
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Location"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
