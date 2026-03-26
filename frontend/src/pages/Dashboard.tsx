import { useState } from "react";
import { useLocation } from "react-router-dom";
import { Eye, Shield, Lock, Share2, Copy, Mail, CheckSquare } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DocumentChecklist, { getDocumentChecklistProgress } from "@/components/dashboard/DocumentChecklist";
import DocumentRepository from "@/components/dashboard/DocumentRepository";
import ChatInterface from "@/components/dashboard/ChatInterface";
import SettingsModal from "@/components/dashboard/SettingsModal";
import { Button } from "@/components/ui/button";
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [documentChecklistOpen, setDocumentChecklistOpen] = useState(false);
  const { completed: checklistDone, total: checklistTotal } = getDocumentChecklistProgress();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      {tab === "prepare" && (
        <div className="flex flex-1 h-full flex-col overflow-hidden">
          <div className="border-b border-border bg-card px-8 py-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-2xl font-serif font-bold text-foreground">Prepare</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Capture information and build the business profile.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-9 shrink-0 gap-2 border-border bg-transparent px-3 text-foreground hover:bg-muted sm:mt-0"
                onClick={() => setDocumentChecklistOpen(true)}
              >
                <CheckSquare className="h-4 w-4" />
                <span>Document checklist</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                  {checklistDone}/{checklistTotal}
                </span>
              </Button>
            </div>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ChatInterface />
          </div>
          <DocumentChecklist open={documentChecklistOpen} onOpenChange={setDocumentChecklistOpen} />
        </div>
      )}

      {tab === "documents" && (
        <div className="flex flex-1 h-full flex-col overflow-hidden">
          <div className="border-b border-border bg-card px-8 py-6 shrink-0">
            <h1 className="text-2xl font-serif font-bold text-foreground">Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse the data room, upload new files, or remove outdated documents.
            </p>
          </div>
          <div className="flex-1 min-h-0">
            <DocumentRepository />
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
