import { NavLink as RouterNavLink } from "react-router-dom";
import { LucideIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  LayoutDashboard,
  Building2,
  Users,
  Clock,
  DollarSign,
  FileText,
  MapPin,
  ClipboardList,
  Settings,
  Shield,
} from "lucide-react";

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  section?: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, section: "Overview" },
  { title: "Companies", url: "/companies", icon: Building2, section: "Overview" },
  { title: "Employees", url: "/employees", icon: Users, section: "Management" },
  { title: "Attendance", url: "/attendance", icon: Clock, section: "Management" },
  { title: "Payroll", url: "/payroll", icon: DollarSign, section: "Management" },
  { title: "Locations", url: "/locations", icon: MapPin, section: "Management" },
  { title: "Requests", url: "/requests", icon: ClipboardList, section: "Management" },
  { title: "Reports", url: "/reports", icon: FileText, section: "Reports" },
  { title: "Settings", url: "/settings", icon: Settings, section: "System" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const sections = navItems.reduce((acc, item) => {
    const section = item.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

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
