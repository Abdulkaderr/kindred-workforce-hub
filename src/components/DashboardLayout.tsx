import { useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Bell, Search, User } from "lucide-react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      <div className={`transition-all duration-200 ${collapsed ? "ml-16" : "ml-60"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
                className="h-9 w-64 rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative rounded-md p-2 hover:bg-muted transition-colors">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
            </button>
            <div className="ml-2 flex items-center gap-2 rounded-md border px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                <User className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium">Super Admin</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
