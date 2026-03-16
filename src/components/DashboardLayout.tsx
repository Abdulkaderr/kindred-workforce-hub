import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, User, Menu } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, role } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar - hidden on mobile unless mobileOpen */}
      <div className={`lg:block ${mobileOpen ? "block" : "hidden"}`}>
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      <div className={`transition-all duration-200 ${collapsed ? "lg:ml-16" : "lg:ml-60"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-4 sm:px-6">
          <button className="lg:hidden rounded-md p-2 hover:bg-muted transition-colors" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <button className="relative rounded-md p-2 hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="ml-2 flex items-center gap-2 rounded-md border px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <div className="text-sm hidden sm:block">
                <span className="font-medium">{displayName}</span>
                {roleLabel && <span className="ml-1.5 text-xs text-muted-foreground">({roleLabel})</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
