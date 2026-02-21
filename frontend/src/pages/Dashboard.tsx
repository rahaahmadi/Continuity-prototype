import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Eye, Shield, Lock, Share2, Copy, Mail, MoreHorizontal } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DocumentChecklist from "@/components/dashboard/DocumentChecklist";
import ChatInterface from "@/components/dashboard/ChatInterface";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const shareTiers = [
  {
    title: "Business Overview",
    icon: Eye,
    description: "High-level summary, market position, and growth narrative.",
    badge: "Tier 1",
  },
  {
    title: "Operations & Processes",
    icon: Shield,
    description: "SOPs, workflows, and key relationships under NDA.",
    badge: "Tier 2",
  },
  {
    title: "Financial Deep Dive",
    icon: Lock,
    description: "Full financials and projections shared after LOI.",
    badge: "Tier 3",
  },
];

const Dashboard = () => {
  const location = useLocation();
  const tab = new URLSearchParams(location.search).get("tab") ?? "prepare";
  const documentsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tab === "documents") {
      documentsScrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [tab]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />

      {tab === "prepare" && (
        <div className="flex flex-1 h-full flex-col overflow-hidden">
          <div className="border-b border-border bg-card px-8 py-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Prepare</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Capture information and build the business profile.
            </p>
          </div>
          <div className="flex flex-1 min-h-0">
            <DocumentChecklist />
            <div className="flex-1 overflow-y-auto">
              <ChatInterface />
            </div>
          </div>
        </div>
      )}

      {tab === "documents" && (
        <div className="flex flex-1 h-full">
          <div className="flex-1 overflow-y-auto" ref={documentsScrollRef}>
            <div className="border-b border-border bg-card px-8 py-6">
              <h1 className="text-2xl font-serif font-bold text-foreground">Documents</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Browse the data room, upload new files, or remove outdated documents.
              </p>
            </div>
            <div className="p-8 max-w-4xl space-y-6">
              <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-foreground">Document Repository</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Store, organize, and manage the files tied to your business profile.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="gap-2">
                      <Copy className="h-4 w-4" /> Import
                    </Button>
                    <Button className="gradient-gold text-accent-foreground shadow-gold hover:opacity-90">
                      Upload Files
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  "2023 Financials.pdf",
                  "Customer Contracts.zip",
                  "Ops SOPs v4.docx",
                  "Employee Handbook.pdf",
                ].map(file => (
                  <div key={file} className="p-5 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">{file}</h3>
                        <p className="text-xs text-muted-foreground mt-1">Last updated 3 days ago</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Summarize</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "share" && (
        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-border bg-card px-8 py-6">
            <h1 className="text-2xl font-serif font-bold text-foreground">Share</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Control access levels and share the right view with each buyer.
            </p>
          </div>

          <div className="p-8 max-w-5xl space-y-6">
            <div className="grid lg:grid-cols-3 gap-4">
              {shareTiers.map(tier => (
                <div key={tier.title} className="p-5 rounded-xl border border-border bg-card shadow-soft">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                      <tier.icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <span className={cn(
                      "text-xs px-2.5 py-1 rounded-full font-medium",
                      tier.badge === "Tier 1" && "bg-success/10 text-success",
                      tier.badge === "Tier 2" && "bg-accent/10 text-gold-dark",
                      tier.badge === "Tier 3" && "bg-destructive/10 text-destructive"
                    )}>
                      {tier.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{tier.title}</h3>
                  <p className="text-sm text-muted-foreground">{tier.description}</p>
                </div>
              ))}
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">Share link</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Invite a buyer with a secure, permissioned link.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="gap-2">
                    <Copy className="h-4 w-4" /> Copy Link
                  </Button>
                  <Button className="gradient-gold text-accent-foreground shadow-gold hover:opacity-90 gap-2">
                    <Mail className="h-4 w-4" /> Send Invite
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">Access controls</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set NDA and LOI gates before unlocking deeper sections.
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Share2 className="h-4 w-4" /> Manage Access
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
