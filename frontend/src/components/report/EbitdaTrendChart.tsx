import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type WidgetPoint = {
  period: string;
  value_raw: string;
  value_numeric: number | null;
};

type Props = {
  ebitdaPoints: WidgetPoint[];
  marginPoints: WidgetPoint[];
};

function mergeByPeriod(ebitdaPoints: WidgetPoint[], marginPoints: WidgetPoint[]) {
  const periodSet = new Set([
    ...ebitdaPoints.map((p) => p.period),
    ...marginPoints.map((p) => p.period),
  ]);
  const ebitdaMap = new Map(ebitdaPoints.map((p) => [p.period, p.value_numeric]));
  const marginMap = new Map(marginPoints.map((p) => [p.period, p.value_numeric]));
  return [...periodSet]
    .sort()
    .map((period) => ({
      period,
      ebitda: ebitdaMap.get(period) ?? null,
      ebitda_margin: marginMap.get(period) ?? null,
    }));
}

export default function EbitdaTrendChart({ ebitdaPoints, marginPoints }: Props) {
  const data = mergeByPeriod(ebitdaPoints, marginPoints);
  const hasEbitda = ebitdaPoints.length > 0;
  const hasMargin = marginPoints.length > 0;

  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-soft">
      <h3 className="font-semibold text-foreground text-lg mb-4">EBITDA Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 10, right: hasMargin ? 48 : 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
          <XAxis
            dataKey="period"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          {hasEbitda && (
            <YAxis
              yAxisId="left"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickFormatter={(v: number) =>
                v >= 1_000_000
                  ? `$${(v / 1_000_000).toFixed(1)}M`
                  : `$${(v / 1_000).toFixed(0)}K`
              }
            />
          )}
          {hasMargin && (
            <YAxis
              yAxisId="right"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#60a5fa", fontSize: 12 }}
              tickFormatter={(v: number) => `${v}%`}
            />
          )}
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === "ebitda")
                return [`$${value.toLocaleString()}`, "EBITDA $"];
              if (name === "ebitda_margin")
                return [`${value}%`, "EBITDA Margin %"];
              return [value, name];
            }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend
            formatter={(value) =>
              value === "ebitda"
                ? "EBITDA $ (left axis)"
                : "EBITDA margin % (right axis)"
            }
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }}
          />
          {hasEbitda && (
            <Bar
              yAxisId="left"
              dataKey="ebitda"
              fill="#84cc16"
              radius={[4, 4, 0, 0]}
              maxBarSize={60}
            />
          )}
          {hasMargin && (
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ebitda_margin"
              stroke="#60a5fa"
              strokeWidth={2}
              dot={{ fill: "#60a5fa", r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
