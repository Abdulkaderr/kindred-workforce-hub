import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Shield, Bell, Lock, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Platform configuration</p>
        </div>
      </div>

      <div className="grid gap-4 max-w-2xl">
        {[
          { icon: Shield, title: "Security", desc: "Manage authentication and security policies" },
          { icon: Bell, title: "Notifications", desc: "Configure email and push notification preferences" },
          { icon: Lock, title: "Access Control", desc: "Role-based permissions and access management" },
          { icon: Globe, title: "General", desc: "Platform name, timezone, and language settings" },
        ].map((item, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-muted p-2.5">
                <item.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Configure</Button>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
