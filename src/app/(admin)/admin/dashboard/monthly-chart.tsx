"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MonthlyTotal } from "./actions";

type MonthlyChartProps = {
  data: MonthlyTotal[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) => (
          <p key={entry.name} style={{ color: entry.color }}>
            {entry.name === "Interest ($)"
              ? `${entry.name}: ${formatCurrency(entry.value)}`
              : `${entry.name}: ${entry.value.toFixed(2)}%`}
          </p>
        )
      )}
    </div>
  );
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Monthly Interest</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => `${v.toFixed(1)}%`}
              tick={{ fontSize: 12 }}
              className="fill-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="totalInterest"
              name="Interest ($)"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="interestRate"
              name="Rate (%)"
              stroke="hsl(var(--secondary-foreground))"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
