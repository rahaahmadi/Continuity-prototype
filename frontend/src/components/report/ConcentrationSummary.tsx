import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

type ParsedRow = { label: string; value: number; raw: string };

const LADDER_FILLS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))"];

/** Extract label + numeric % from common extraction shapes. */
function parseConcentrationLine(line: string): ParsedRow | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const pctMatch = trimmed.match(/(\d+\.?\d*)\s*%/);
  if (!pctMatch) return null;
  const value = Number.parseFloat(pctMatch[1]);
  if (Number.isNaN(value)) return null;

  let label = trimmed
    .replace(/\s*[\u2014\u2013\-–—:]\s*\d+\.?\d*\s*%.*$/i, "")
    .replace(/\s+\d+\.?\d*\s*%.*$/i, "")
    .trim();
  if (!label) label = trimmed;

  return { label, value, raw: trimmed };
}

function ladderSortKey(label: string): number {
  const l = label.toLowerCase();
  if (/\btop\s*1\b/.test(l)) return 1;
  if (/\btop\s*5\b/.test(l)) return 2;
  if (/\btop\s*10\b/.test(l)) return 3;
  return 50;
}

function isCustomerLadderRow(label: string): boolean {
  const l = label.toLowerCase();
  if (!/\btop\s*(1|5|10)\b/.test(l)) return false;
  if (l.includes("recurring")) return false;
  return l.includes("customer") || l.includes("% of") || l.includes("revenue");
}

type Props = {
  lines: string[];
};

export default function ConcentrationSummary({ lines }: Props) {
  const parsed = lines.map(parseConcentrationLine).filter((r): r is ParsedRow => r !== null);
  const failed = lines.filter((line) => parseConcentrationLine(line) === null && line.trim());

  const ladderRows = parsed
    .filter((r) => isCustomerLadderRow(r.label))
    .sort((a, b) => ladderSortKey(a.label) - ladderSortKey(b.label));
  const ladderChartData = ladderRows.map((r, i) => ({
    ...r,
    fill: LADDER_FILLS[Math.min(i, LADDER_FILLS.length - 1)],
  }));

  const barHeight = 36;
  const chartHeight = Math.max(140, ladderChartData.length * barHeight + 48);
  const hasBars = ladderChartData.length > 0;

  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-soft space-y-6">
      <div>
        <h3 className="font-semibold text-foreground text-lg">Concentration summary</h3>
      </div>

      {ladderChartData.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Customer share of revenue
          </h4>
          <ResponsiveContainer width="100%" height={chartHeight} minHeight={chartHeight}>
            <BarChart
              layout="vertical"
              data={ladderChartData}
              margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              barCategoryGap={12}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-border/50" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                axisLine={{ stroke: "hsl(var(--border))" }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={268}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "Share"]}
                labelFormatter={(label) => (typeof label === "string" ? label : String(label))}
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {ladderChartData.map((entry, index) => (
                  <Cell key={`ladder-${entry.raw}-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {failed.length > 0 && (
        <ul className={`space-y-2 text-sm text-muted-foreground ${hasBars ? "border-t border-border pt-4" : ""}`}>
          {failed.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
