import { useEffect, useRef, useState } from "react";
import {
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Cog,
  Users,
  UserRound,
  ShieldCheck,
  Target,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { getKeyInsights, type KeyInsightKind, type KeyInsightResponse } from "@/lib/api";

const POLL_INTERVAL_MS = 2500;

type KeyInsightsStatus = "loading" | "none" | "pending" | "ready" | "failed";

type KindMeta = {
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
};

const kindMeta: Record<KeyInsightKind, KindMeta> = {
  growth:     { icon: TrendingUp,   colorClass: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/15" },
  risk:       { icon: AlertTriangle, colorClass: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/15" },
  financial:  { icon: DollarSign,   colorClass: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15" },
  operations: { icon: Cog,          colorClass: "text-blue-700 bg-blue-100 dark:text-blue-300 dark:bg-blue-500/15" },
  customer:   { icon: Users,        colorClass: "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-500/15" },
  team:       { icon: UserRound,    colorClass: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/15" },
  compliance: { icon: ShieldCheck,  colorClass: "text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-500/15" },
  opportunity:{ icon: Target,       colorClass: "text-orange-700 bg-orange-100 dark:text-orange-300 dark:bg-orange-500/15" },
  other:      { icon: Star,         colorClass: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-500/15" },
};

function ProcessingDots() {
  const dotCount = 8;
  const radius = 20;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center" aria-hidden>
      {Array.from({ length: dotCount }).map((_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + radius * Math.cos(angle);
        const y = 50 + radius * Math.sin(angle);
        return (
          <span
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-accent animate-processing-dot"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: "translate(-50%, -50%)",
              animationDelay: `${(i / dotCount) * 0.6}s`,
            }}
          />
        );
      })}
    </div>
  );
}

const KeyInsights = () => {
  const { token } = useAuth();
  const [status, setStatus] = useState<KeyInsightsStatus>("loading");
  const [insights, setInsights] = useState<KeyInsightResponse[]>([]);
  const pollTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (pollTimeoutRef.current) {
      window.clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }

    if (!token) {
      setStatus("failed");
      setInsights([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      try {
        const data = await getKeyInsights(token);
        if (cancelled) return;

        setStatus(data.status);
        setInsights(data.key_insights ?? []);

        if (data.status === "pending" || data.status === "none") {
          pollTimeoutRef.current = window.setTimeout(load, POLL_INTERVAL_MS);
        }
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setStatus("failed");
        setInsights([]);
      }
    };

    setStatus("loading");
    setInsights([]);
    void load();

    return () => {
      cancelled = true;
      if (pollTimeoutRef.current) {
        window.clearTimeout(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
  }, [token]);

  const isGenerating = status === "loading" || status === "pending" || status === "none";

  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
      <h3 className="font-semibold text-foreground text-lg mb-4">Key Insights</h3>

      {isGenerating && (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
          <ProcessingDots />
          <p className="text-sm font-medium text-foreground mt-5">Generating</p>
          <p className="text-xs text-muted-foreground mt-1.5 max-w-[260px]">
            Creating your top key insights from uploaded documents.
          </p>
        </div>
      )}

      {!isGenerating && status === "failed" && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3">
          <p className="text-sm text-destructive">Unable to generate key insights right now. Please try again.</p>
        </div>
      )}

      {!isGenerating && status === "ready" && insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((insight, index) => {
            const meta = kindMeta[insight.kind] ?? kindMeta.other;
            const Icon = meta.icon;

            return (
              <div key={`${insight.title}-${index}`} className="flex gap-3 p-3 rounded-lg bg-muted/30">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", meta.colorClass)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-foreground">{insight.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isGenerating && status === "ready" && insights.length === 0 && (
        <div className="rounded-lg border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
          No key insights available yet.
        </div>
      )}
    </div>
  );
};

export default KeyInsights;
