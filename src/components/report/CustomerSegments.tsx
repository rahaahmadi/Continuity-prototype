import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

const segmentData = [
  { name: "Enterprise", value: 35, color: "hsl(var(--primary))" },
  { name: "SMB", value: 40, color: "hsl(var(--accent))" },
  { name: "Startup", value: 15, color: "hsl(var(--success))" },
  { name: "Individual", value: 10, color: "hsl(var(--muted-foreground))" },
];

const chartConfig = {
  enterprise: { label: "Enterprise", color: "hsl(var(--primary))" },
  smb: { label: "SMB", color: "hsl(var(--accent))" },
  startup: { label: "Startup", color: "hsl(var(--success))" },
  individual: { label: "Individual", color: "hsl(var(--muted-foreground))" },
};

const CustomerSegments = () => {
  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
      <h3 className="font-semibold text-foreground text-lg mb-4">Customer Segments</h3>
      <ChartContainer config={chartConfig} className="h-[280px] w-full">
        <PieChart>
          <Pie
            data={segmentData}
            cx="50%"
            cy="50%"
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
