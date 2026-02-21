import { TrendingUp, AlertTriangle, Star, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Insight {
  type: "positive" | "warning" | "highlight" | "opportunity";
  title: string;
  description: string;
}

const insights: Insight[] = [
  {
    type: "positive",
    title: "Strong Revenue Growth",
    description: "Revenue has grown 89% year-over-year, outpacing industry average of 15%.",
  },
  {
    type: "highlight",
    title: "Low Customer Concentration",
    description: "No single customer accounts for more than 8% of revenue, reducing risk.",
  },
  {
    type: "opportunity",
    title: "Expansion Potential",
    description: "Current market penetration is 12% with clear path to 35% in adjacent segments.",
  },
  {
    type: "warning",
    title: "Key Person Dependency",
    description: "3 employees hold critical operational knowledge. Documentation in progress.",
  },
];

const iconMap = {
  positive: TrendingUp,
  warning: AlertTriangle,
  highlight: Star,
  opportunity: Target,
};

const colorMap = {
  positive: "text-success bg-success/10",
  warning: "text-destructive bg-destructive/10",
  highlight: "text-accent bg-accent/10",
  opportunity: "text-primary bg-primary/10",
};

const KeyInsights = () => {
  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
      <h3 className="font-semibold text-foreground text-lg mb-4">Key Insights</h3>
      <div className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = iconMap[insight.type];
          return (
            <div key={index} className="flex gap-3 p-3 rounded-lg bg-muted/30">
              <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0", colorMap[insight.type])}>
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
    </div>
  );
};

export default KeyInsights;
