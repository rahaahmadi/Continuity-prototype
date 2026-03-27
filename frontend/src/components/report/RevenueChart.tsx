import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const fallbackRevenueData = [
  { month: "Jan", revenue: 180000 },
  { month: "Feb", revenue: 195000 },
  { month: "Mar", revenue: 210000 },
  { month: "Apr", revenue: 185000 },
  { month: "May", revenue: 225000 },
  { month: "Jun", revenue: 240000 },
  { month: "Jul", revenue: 235000 },
  { month: "Aug", revenue: 260000 },
  { month: "Sep", revenue: 275000 },
  { month: "Oct", revenue: 290000 },
  { month: "Nov", revenue: 310000 },
  { month: "Dec", revenue: 340000 },
];

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--accent))",
  },
};

type RevenuePoint = {
  period: string;
  value_raw: string;
  value_numeric: number | null;
};

type RevenueChartProps = {
  points?: RevenuePoint[];
};

const RevenueChart = ({ points }: RevenueChartProps) => {
  const revenueData =
    points && points.length > 0
      ? points.map((point) => ({
          month: point.period,
          revenue: point.value_numeric ?? 0,
        }))
      : fallbackRevenueData;

  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
      <h3 className="font-semibold text-foreground text-lg mb-4">Revenue Trend (TTM)</h3>
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false}
            className="text-xs fill-muted-foreground"
          />
          <YAxis 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            className="text-xs fill-muted-foreground"
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value) => [`$${Number(value).toLocaleString()}`, "Revenue"]}
              />
            } 
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="hsl(var(--accent))"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
};

export default RevenueChart;
