import { DashboardLayout } from "@/components/DashboardLayout";
import { MapPin, Plus, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

const locations = [
  { id: 1, name: "Main Office", company: "Acme Corp", lat: "40.7128", lng: "-74.0060", radius: 200, employees: 120 },
  { id: 2, name: "Warehouse A", company: "Acme Corp", lat: "40.7282", lng: "-73.7949", radius: 500, employees: 45 },
  { id: 3, name: "Tech Hub", company: "TechFlow Inc", lat: "37.7749", lng: "-122.4194", radius: 150, employees: 89 },
  { id: 4, name: "Construction Site B", company: "BuildRight Co", lat: "34.0522", lng: "-118.2437", radius: 300, employees: 67 },
  { id: 5, name: "Distribution Center", company: "Global Logistics", lat: "41.8781", lng: "-87.6298", radius: 400, employees: 156 },
];

export default function LocationsPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Locations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage GPS-verified work zones</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-1.5" /> Add Location
        </Button>
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <table className="data-table">
          <thead>
            <tr>
              <th>Location</th>
              <th>Company</th>
              <th>Coordinates</th>
              <th>Radius</th>
              <th>Assigned Employees</th>
              <th className="w-12"></th>
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
                <td className="text-muted-foreground">{l.company}</td>
                <td className="mono text-muted-foreground">{l.lat}, {l.lng}</td>
                <td className="mono">{l.radius}m</td>
                <td className="mono">{l.employees}</td>
                <td>
                  <button className="rounded p-1 hover:bg-muted transition-colors">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
