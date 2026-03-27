import { PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--success))",
  "hsl(var(--muted-foreground))",
  "#60a5fa",
  "#f472b6",
];

const chartConfig = {};

type TopCustomer = {
  name: string;
  percentage_of_revenue: string | null;
};

type CustomerSegmentsProps = {
  topCustomers?: TopCustomer[];
};

function parsePercentage(value: string | null): number | null {
  if (!value) return null;
  const match = value.match(/-?\d+(\.\d+)?/);
  const parsed = match ? Number(match[0]) : null;
  return parsed !== null && parsed > 0 ? parsed : null;
}

const CustomerSegments = ({ topCustomers }: CustomerSegmentsProps) => {
  const segmentData = (topCustomers ?? [])
    .map((c, index) => {
      const pct = parsePercentage(c.percentage_of_revenue);
      if (pct === null) return null;
      return {
        name: c.name || `Customer ${index + 1}`,
        value: pct,
        color: COLORS[index % COLORS.length],
      };
    })
    .filter((item): item is { name: string; value: number; color: string } => item !== null);

  if (segmentData.length === 0) return null;

  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
      <h3 className="font-semibold text-foreground text-lg mb-4">Customer Concentration</h3>
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <PieChart>
          <Pie
            data={segmentData}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {segmentData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border border-border bg-background px-3 py-2 shadow-lg">
                    <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
                    <p className="text-sm text-muted-foreground">{payload[0].value}% of revenue</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend
            verticalAlign="bottom"
            formatter={(value) => <span className="text-sm text-foreground">{value}</span>}
          />
        </PieChart>
      </ChartContainer>
    </div>
  );
};

export default CustomerSegments;
