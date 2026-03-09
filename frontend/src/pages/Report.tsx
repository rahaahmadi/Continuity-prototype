import { useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Share2, Download, MessageSquare, TrendingUp, Users, DollarSign, Building2, Shield, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import RevenueChart from "@/components/report/RevenueChart";
import CustomerSegments from "@/components/report/CustomerSegments";
import KeyInsights from "@/components/report/KeyInsights";
import QAChat from "@/components/report/QAChat";
import BusinessOverviewSidebar from "@/components/report/BusinessOverviewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getBusinessOverview, type BusinessOverviewResponse } from "@/lib/api";

const readinessScore = 42;

const metrics = [
  { label: "Revenue (TTM)", value: "$2.4M", change: "+12%", icon: DollarSign },
  { label: "EBITDA Margin", value: "18.5%", change: "+3.2%", icon: TrendingUp },
  { label: "Employees", value: "24", change: "", icon: Users },
  { label: "Years Operating", value: "12", change: "", icon: Building2 },
];

const sections = [
  { title: "Business Overview", tier: 1, icon: Eye, description: "Company summary, industry, and market position." },
  { title: "Operations & Processes", tier: 2, icon: Shield, description: "SOPs, workflows, key vendor and customer relationships." },
  { title: "Financial Deep Dive", tier: 3, icon: Lock, description: "Detailed P&L, balance sheet, cash flow projections." },
  { title: "Team & Organization", tier: 2, icon: Users, description: "Org chart, key personnel, succession readiness." },
  { title: "Growth Opportunities", tier: 1, icon: TrendingUp, description: "Market expansion, product development, partnerships." },
];

const tierLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Tier 1 · Overview", color: "bg-success/10 text-success" },
  2: { label: "Tier 2 · NDA Required", color: "bg-accent/10 text-gold-dark" },
  3: { label: "Tier 3 · LOI Required", color: "bg-destructive/10 text-destructive" },
};

const Report = () => {
  const { token } = useAuth();
  const [showChat, setShowChat] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewStatus, setOverviewStatus] = useState<BusinessOverviewResponse["status"] | "loading">(
    "none",
  );
  const [overviewContent, setOverviewContent] = useState<string | null>(null);

  const loadBusinessOverview = async () => {
    if (!token) return;
    try {
      setOverviewStatus("loading");
      setOverviewOpen(true);
      const data = await getBusinessOverview(token);
      setOverviewStatus(data.status);
      setOverviewContent(data.content);
    } catch (e) {
      console.error(e);
      setOverviewStatus("failed");
      setOverviewContent(null);
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-card px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Business Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">Generated insights and reports for your business.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Export
              </Button>
              <Button size="sm" className="gradient-gold text-accent-foreground shadow-gold hover:opacity-90 gap-1.5">
                <Share2 className="h-3.5 w-3.5" /> Share with Buyer
              </Button>
            </div>
          </div>
        </div>

        <div className="p-8 max-w-5xl w-full mx-auto">
          {!overviewOpen && (
            <div className="space-y-8">
              {/* Readiness Score */}
              <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-foreground text-lg font-sans">Sale Readiness Score</h2>
                  <span className="text-3xl font-bold text-gradient-gold">{readinessScore}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-gold rounded-full transition-all duration-700"
                    style={{ width: `${readinessScore}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Continue uploading documents and answering questions to improve your score.
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(m => (
                  <div key={m.label} className="p-4 rounded-xl border border-border bg-card shadow-soft">
                    <div className="flex items-center gap-2 mb-2">
                      <m.icon className="h-4 w-4 text-accent" />
                      <span className="text-xs text-muted-foreground">{m.label}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-foreground">{m.value}</span>
                      {m.change && <span className="text-xs font-medium text-success">{m.change}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RevenueChart />
                <CustomerSegments />
              </div>

              {/* Key Insights */}
              <KeyInsights />

              {/* Report Sections */}
              <div>
                <h2 className="font-semibold text-foreground text-lg font-sans mb-4">Report Sections</h2>
                <div className="space-y-3">
                  {sections.map(s => {
                    const tier = tierLabels[s.tier];
                    return (
                      <div
                        key={s.title}
                        className="p-4 rounded-xl border border-border bg-card hover:shadow-elevated transition-shadow cursor-pointer"
                        onClick={s.title === "Business Overview" ? loadBusinessOverview : undefined}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                              <s.icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                              <p className="text-xs text-muted-foreground">{s.description}</p>
                            </div>
                          </div>
                          <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", tier.color)}>
                            {tier.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {overviewOpen && (
            <BusinessOverviewSidebar
              isOpen={overviewOpen}
              status={overviewStatus}
              content={overviewContent}
              onBack={() => setOverviewOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Q&A Chat */}
      <QAChat isOpen={showChat} onClose={() => setShowChat(false)} />

      {/* Q&A FAB */}
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full gradient-gold shadow-gold flex items-center justify-center hover:opacity-90 transition-opacity z-50"
        >
          <MessageSquare className="h-5 w-5 text-accent-foreground" />
        </button>
      )}
    </div>
  );
};

export default Report;
