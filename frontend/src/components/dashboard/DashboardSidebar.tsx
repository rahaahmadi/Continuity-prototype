import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, MessageSquare, FileBarChart, FolderOpen, Share2, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const navItems = [
  { to: "/dashboard?tab=prepare", icon: Brain, label: "Prepare", tab: "prepare" },
  { to: "/report", icon: FileBarChart, label: "Reports" },
  { to: "/dashboard?tab=documents", icon: FolderOpen, label: "Documents", tab: "documents" },
  { to: "/qa", icon: MessageSquare, label: "Q&A" },
  { to: "/dashboard?tab=share", icon: Share2, label: "Share", tab: "share" },
];

function getInitials(email: string): string {
  const part = email.split("@")[0];
  if (!part) return "?";
  const segments = part.replace(/[._-]/g, " ").trim().split(/\s+/);
  if (segments.length >= 2) return (segments[0][0] + segments[1][0]).toUpperCase().slice(0, 2);
  return part.slice(0, 2).toUpperCase();
}

type DashboardSidebarProps = {
  onOpenSettings?: () => void;
};

const DashboardSidebar = ({ onOpenSettings }: DashboardSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const tab = new URLSearchParams(location.search).get("tab");

  const handleLogout = async () => {
    setPopoverOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const handleOpenSettings = () => {
    setPopoverOpen(false);
    onOpenSettings?.();
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
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="h-10 w-10 rounded-full flex items-center justify-center ring-2 ring-sidebar-foreground/20 hover:ring-sidebar-foreground/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              aria-label="User menu"
            >
              <Avatar className="h-10 w-10 rounded-full bg-sidebar-accent border-2 border-sidebar-accent">
                <AvatarFallback className="rounded-full bg-sidebar-accent text-sidebar-foreground text-xs font-medium">
                  {user ? getInitials(user.email) : "?"}
                </AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="right"
            sideOffset={12}
            className="w-64 rounded-xl border border-border bg-card p-0 shadow-lg"
          >
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-full bg-muted">
                  <AvatarFallback className="rounded-full bg-muted text-muted-foreground text-sm font-medium">
                    {user ? getInitials(user.email) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {user?.email?.split("@")[0] ?? "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email ?? ""}</span>
                </div>
              </div>
            </div>
            <div className="py-1">
              <button
                type="button"
                onClick={handleOpenSettings}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors"
              >
                <Settings className="h-4 w-4 text-muted-foreground shrink-0" />
                Settings
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-muted/80 transition-colors"
              >
                <LogOut className="h-4 w-4 text-muted-foreground shrink-0" />
                Log out
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DashboardSidebar;
