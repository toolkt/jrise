"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DownloadIcon, EyeIcon } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border bg-background p-3 shadow-sm text-sm">
      <p className="font-semibold mb-1">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    ANNUAL: "Annual",
    CUSTOM: "Custom",
    CLOSE: "Close",
  };
  return map[type] ?? type;
}

interface MonthlyBreakdownItem {
  month: string;
  earned: number;
  rate: number;
}

interface StatItem {
  label: string;
  value: string;
}

interface StatementItem {
  id: string;
  number: string;
  period: string;
  type: string;
}

interface PortalDashboardProps {
  clientName: string;
  currentBalance: number;
  ytdInterestEarned: number;
  openingPrincipal: number;
  ytdReturn: number;
  monthlyBreakdown: MonthlyBreakdownItem[];
  stats: StatItem[];
  statements: StatementItem[];
}

export function PortalDashboard({
  clientName,
  currentBalance,
  ytdInterestEarned,
  openingPrincipal,
  ytdReturn,
  monthlyBreakdown,
  stats,
  statements,
}: PortalDashboardProps) {
  const firstName = clientName.split(" ")[0];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-8 text-white">
        <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
        <p className="mt-1 text-purple-200 text-sm">
          Here&apos;s your investment overview
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(currentBalance)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              YTD return:{" "}
              <span className="text-green-600 font-medium">+{ytdReturn}%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              YTD Interest Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(ytdInterestEarned)}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Year to date earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opening Investment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(openingPrincipal)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Initial principal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Interest Chart */}
      {monthlyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Monthly Interest Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={monthlyBreakdown}
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="earned"
                  name="Earned"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Two-column grid: Earnings Breakdown + Account Statistics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Earnings Breakdown Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Earnings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {monthlyBreakdown.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                No monthly records yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Earned</TableHead>
                    <TableHead>Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyBreakdown.map((item) => (
                    <TableRow key={item.month}>
                      <TableCell className="text-sm">{item.month}</TableCell>
                      <TableCell className="text-sm font-medium text-green-600">
                        {formatCurrency(item.earned)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.rate.toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Account Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {stats.map((stat) => (
                <li
                  key={stat.label}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                  <span className="text-sm font-medium">{stat.value}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Statements */}
      {statements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Statements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {statements.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-mono text-sm font-medium">{s.number}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.period}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{typeLabel(s.type)}</Badge>
                  <a
                    href={`/api/pdf/${s.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <EyeIcon className="h-3.5 w-3.5" />
                    View
                  </a>
                  <a
                    href={`/api/pdf/${s.id}`}
                    download={`${s.number}.pdf`}
                    className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                  >
                    <DownloadIcon className="h-3.5 w-3.5" />
                    Download PDF
                  </a>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Disclaimer */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Disclaimer:</strong> The information contained in this portal
            is provided for general information purposes only. It does not
            constitute financial advice or tax advice. Interest earnings may be
            assessable income for Australian tax purposes. You should consult a
            registered tax agent or financial adviser for advice specific to your
            circumstances. Past performance is not a reliable indicator of future
            performance.
          </p>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="border-t pt-4 text-center text-xs text-muted-foreground">
        <p className="font-semibold">JRISE Smart Trading</p>
        <p className="mt-1">
          For enquiries, please contact your JRISE account manager.
        </p>
      </div>
    </div>
  );
}
