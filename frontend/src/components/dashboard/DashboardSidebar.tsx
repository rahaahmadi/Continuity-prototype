import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, MessageSquare, FileBarChart, FolderOpen, Share2, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/dashboard?tab=prepare", icon: Brain, label: "Prepare", tab: "prepare" },
  { to: "/report", icon: FileBarChart, label: "Reports" },
  { to: "/dashboard?tab=documents", icon: FolderOpen, label: "Documents", tab: "documents" },
  { to: "/qa", icon: MessageSquare, label: "Q&A" },
  { to: "/dashboard?tab=share", icon: Share2, label: "Share", tab: "share" },
];

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const tab = new URLSearchParams(location.search).get("tab");

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="w-16 gradient-navy flex flex-col items-center py-4 gap-1">
      <Link to="/dashboard" className="mb-6">
        <div className="h-9 w-9 rounded-lg gradient-gold flex items-center justify-center">
          <span className="text-sm font-bold text-accent-foreground">C</span>
        </div>
      </Link>

      {navItems.map(item => {
        const active =
          item.tab
            ? location.pathname === "/dashboard" && (tab ?? "prepare") === item.tab
            : location.pathname === item.to;
        return (
          <Link key={item.label} to={item.to}>
            <div className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center transition-colors cursor-pointer group relative",
              active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/50"
            )}>
              <item.icon className={cn(
                "h-4.5 w-4.5 transition-colors",
                active ? "text-sidebar-primary" : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
              )} />
              <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
                {item.label}
              </div>
            </div>
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col gap-1">
        <Link to="/dashboard?tab=prepare">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors cursor-pointer group relative">
            <Settings className="h-4.5 w-4.5 text-sidebar-foreground/60 group-hover:text-sidebar-foreground" />
            <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
              Settings
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="h-10 w-10 rounded-lg flex items-center justify-center hover:bg-sidebar-accent/50 transition-colors cursor-pointer group relative text-sidebar-foreground/60 hover:text-destructive focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          aria-label="Log out"
        >
          <LogOut className="h-4.5 w-4.5" />
          <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50">
            Log out
          </div>
        </button>
      </div>
    </div>
  );
};

export default DashboardSidebar;
