import { NavLink as RouterNavLink } from "react-router-dom";
import { LucideIcon, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  ClipboardList,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  section?: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, section: "Overview" },
  { title: "Employees", url: "/employees", icon: Users, section: "Management", adminOnly: true },
  { title: "Attendance", url: "/attendance", icon: Clock, section: "Management", adminOnly: true },
  { title: "Payroll", url: "/payroll", icon: DollarSign, section: "Management", adminOnly: true },
  { title: "Locations", url: "/locations", icon: MapPin, section: "Management", adminOnly: true },
  { title: "Requests", url: "/requests", icon: ClipboardList, section: "Management", adminOnly: true },
  { title: "Reports", url: "/reports", icon: FileText, section: "Reports", adminOnly: true },
  { title: "Settings", url: "/settings", icon: Settings, section: "System" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const { user, role, signOut } = useAuth();

  const filteredItems = navItems.filter(item => !item.adminOnly || role === "admin");

  const sections = filteredItems.reduce((acc, item) => {
    const section = item.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1) : "...";

  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-200 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <Shield className="h-6 w-6 shrink-0 text-sidebar-primary" />
        {!collapsed && <span className="ml-2.5 text-base font-semibold text-sidebar-primary-foreground">WorkforceOS</span>}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {Object.entries(sections).map(([section, items]) => (
          <div key={section} className="mb-4">
            {!collapsed && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
                {section}
              </p>
            )}
            {items.map((item) => (
              <RouterNavLink
                key={item.url}
                to={item.url}
                end={item.url === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.title}</span>}
              </RouterNavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User info & Sign out */}
      <div className="border-t border-sidebar-border p-3 space-y-2">
        <div className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent">
            <User className="h-4 w-4 text-sidebar-accent-foreground" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{displayName}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted">{roleLabel}</p>
            </div>
          )}
        </div>
        <button
          onClick={signOut}
          className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="flex h-10 items-center justify-center border-t border-sidebar-border text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
