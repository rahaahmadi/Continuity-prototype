import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import SettingsModal from "@/components/dashboard/SettingsModal";
import { Button } from "@/components/ui/button";
import { Share2, Download, MessageSquare, TrendingUp, Users, DollarSign, Building2, Shield, Lock, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import RevenueChart from "@/components/report/RevenueChart";
import CustomerSegments from "@/components/report/CustomerSegments";
import ConcentrationSummary from "@/components/report/ConcentrationSummary";
import EbitdaTrendChart from "@/components/report/EbitdaTrendChart";
import DebtTrendChart from "@/components/report/DebtTrendChart";
import KeyInsights from "@/components/report/KeyInsights";
import QAChat from "@/components/report/QAChat";
import BusinessOverviewSidebar from "@/components/report/BusinessOverviewSidebar";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBusinessOverview,
  getBusinessProfileWidgets,
  type BusinessOverviewResponse,
  type BusinessProfileWidgetsResponse,
} from "@/lib/api";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [overviewOpen, setOverviewOpen] = useState(false);
  const [overviewStatus, setOverviewStatus] = useState<BusinessOverviewResponse["status"] | "loading">(
    "none",
  );
  const [overviewContent, setOverviewContent] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<BusinessProfileWidgetsResponse | null>(null);
  const [widgetsStatus, setWidgetsStatus] = useState<"loading" | "ready" | "failed">("loading");

  const fetchBusinessOverview = async () => {
    if (!token) return;
    try {
      const data = await getBusinessOverview(token);
      setOverviewStatus(data.status);
      setOverviewContent(data.content);
    } catch (e) {
      console.error(e);
      setOverviewStatus("failed");
      setOverviewContent(null);
    }
  };

  const loadBusinessOverview = async () => {
    setOverviewStatus("loading");
    setOverviewOpen(true);
    await fetchBusinessOverview();
  };

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    const loadWidgets = async () => {
      setWidgetsStatus("loading");
      try {
        const data = await getBusinessProfileWidgets(token);
        if (cancelled) return;
        setWidgets(data);
        setWidgetsStatus("ready");
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setWidgets(null);
        setWidgetsStatus("failed");
      }
    };

    void loadWidgets();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const revenuePoints = widgets?.revenue_trend_points ?? [];
  const readinessScore = widgets?.readiness_score ?? 0;

  // KPI card visibility — only show when data is present
  const revenueTTM = widgets?.business_snapshot.trailing_revenue ?? null;
  const ebitdaTTM = widgets?.business_snapshot.trailing_ebitda ?? null;
  const ebitdaMargin = widgets?.financial_highlights.ebitda_margin ?? null;
  const headcount = widgets?.business_snapshot.headcount ?? null;
  const yearsOp = widgets?.business_snapshot.years_operating ?? null;
  const showRevenueTTM = revenueTTM !== null;
  const showEbitdaTTM = ebitdaTTM !== null;
  const showEbitdaMargin = ebitdaMargin !== null;
  const showHeadcount = headcount !== null;
  const showYearsOp = yearsOp !== null;
  const anyKpiCard = showRevenueTTM || showEbitdaTTM || showEbitdaMargin || showHeadcount || showYearsOp;

  // Chart visibility — only show when trend data is present
  const showRevenueTrend = revenuePoints.length > 0;
  const ebitdaPoints = widgets?.financial_highlights.ebitda_by_period ?? [];
  const ebitdaMarginPoints = widgets?.financial_highlights.ebitda_margin_pct_by_period ?? [];
  const debtPoints = widgets?.financial_highlights.debt_total_by_period ?? [];
  const showEbitdaTrend = ebitdaPoints.length > 0 || ebitdaMarginPoints.length > 0;
  const showDebtTrend = debtPoints.length > 0;
  const showCustomerConcentration = (widgets?.customer_concentration.top_customers ?? []).some(
    (c) => c.percentage_of_revenue !== null && c.percentage_of_revenue !== "",
  );
  const concentrationSummaryLines = widgets?.customer_concentration.percentages ?? [];
  const showConcentrationSummary = concentrationSummaryLines.length > 0;

  useEffect(() => {
    if (!overviewOpen) return;
    if (!token) return;

    // Keep checking while the overview is still being generated.
    const shouldPoll =
      overviewStatus === "loading" || overviewStatus === "pending" || overviewStatus === "none";

    if (!shouldPoll) return;

    const intervalId = window.setInterval(() => {
      void fetchBusinessOverview();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [overviewOpen, overviewStatus, token]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DashboardSidebar onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="border-b border-border bg-card px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-sans font-bold text-foreground">Business Profile</h1>
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
              </div>

              {/* KPI Cards — only render cards with real data */}
              {anyKpiCard && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {showRevenueTTM && (
                    <div className="p-4 rounded-xl border border-border bg-card shadow-soft">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-accent" />
                        <span className="text-xs text-muted-foreground">Revenue (TTM)</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">{revenueTTM}</span>
                    </div>
                  )}
                  {showEbitdaTTM && (
                    <div className="p-4 rounded-xl border border-border bg-card shadow-soft">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <span className="text-xs text-muted-foreground">EBITDA (TTM)</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">{ebitdaTTM}</span>
                    </div>
                  )}
                  {showEbitdaMargin && (
                    <div className="p-4 rounded-xl border border-border bg-card shadow-soft">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        <span className="text-xs text-muted-foreground">EBITDA Margin</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">{ebitdaMargin}</span>
                    </div>
                  )}
                  {showHeadcount && (
                    <div className="p-4 rounded-xl border border-border bg-card shadow-soft">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-accent" />
                        <span className="text-xs text-muted-foreground">Employees</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">{headcount}</span>
                    </div>
                  )}
                  {showYearsOp && (
                    <div className="p-4 rounded-xl border border-border bg-card shadow-soft">
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="h-4 w-4 text-accent" />
                        <span className="text-xs text-muted-foreground">Years Operating</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">{yearsOp}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Widgets grid: stack on mobile, 2-up on larger screens */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {showRevenueTrend && <RevenueChart points={revenuePoints} />}
                {showEbitdaTrend && (
                  <EbitdaTrendChart ebitdaPoints={ebitdaPoints} marginPoints={ebitdaMarginPoints} />
                )}
                {showDebtTrend && <DebtTrendChart points={debtPoints} />}
                {showCustomerConcentration && (
                  <CustomerSegments topCustomers={widgets?.customer_concentration.top_customers} />
                )}
                {showConcentrationSummary && (
                  <ConcentrationSummary lines={concentrationSummaryLines} />
                )}
              </div>

              {widgetsStatus === "failed" && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
                  <p className="text-sm text-destructive">
                    Unable to load business profile widgets right now.
                  </p>
                </div>
              )}

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
