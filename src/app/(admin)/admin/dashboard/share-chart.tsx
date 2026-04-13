"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ShareDistribution } from "./actions";

const COLORS = [
  "#4f46e5", // indigo-600
  "#6366f1", // indigo-500
  "#818cf8", // indigo-400
  "#a5b4fc", // indigo-300
  "#c7d2fe", // indigo-200
];

type ShareChartProps = {
  data: ShareDistribution[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-semibold">{entry.name}</p>
      <p style={{ color: entry.payload.fill }}>
        {entry.payload.percentage.toFixed(1)}%
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload) return null;
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, index: number) => (
        <li key={index} className="flex items-center gap-2">
          <span
            className="inline-block h-3 w-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground truncate max-w-[120px]" title={entry.value}>
            {entry.value}
          </span>
          <span className="ml-auto font-medium">
            {entry.payload?.percentage?.toFixed(1)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

export function ShareChart({ data }: ShareChartProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Client Shares</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={<CustomLegend />}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
