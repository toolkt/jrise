import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { PortalDashboard } from "./portal-dashboard";

export default async function PortalDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const client = await db.client.findFirst({
    where: { userId: user.id },
    include: {
      clientMonthlyRecords: {
        orderBy: { month: "asc" },
        include: { interestRate: true },
      },
      fundTransactions: {
        orderBy: { effectiveDate: "asc" },
      },
      statements: {
        orderBy: { periodStart: "desc" },
      },
    },
  });

  if (!client) redirect("/login");

  const records = client.clientMonthlyRecords;
  const transactions = client.fundTransactions;

  // Current balance: latest closing balance or opening principal
  const latestRecord = records[records.length - 1];
  const currentBalance = latestRecord
    ? Number(latestRecord.closingBalance)
    : Number(client.openingPrincipal);

  // YTD interest earned
  const ytdInterest = records.reduce(
    (sum, r) => sum + Number(r.interestEarned),
    0
  );

  // YTD return %
  const openingPrincipal = Number(client.openingPrincipal);
  const ytdReturn =
    openingPrincipal > 0
      ? Math.round((ytdInterest / openingPrincipal) * 10000) / 100
      : 0;

  // Trading months
  const tradingMonths = records.length;

  // Funds added and repaid from transactions
  const fundsAdded = transactions
    .filter((t) => t.type === "DEPOSIT")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const fundsRepaid = transactions
    .filter((t) => t.type === "INTEREST_REPAID")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Monthly breakdown for chart
  const monthlyBreakdown = records.map((r) => ({
    month: new Date(r.month).toLocaleDateString("en-AU", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    }),
    earned: Math.round(Number(r.interestEarned) * 100) / 100,
    rate: Math.round(Number(r.interestRateApplied) * 10000) / 100,
  }));

  // Stats
  const stats = [
    { label: "Trading Months", value: tradingMonths.toString() },
    {
      label: "Opening Investment",
      value: new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 2,
      }).format(openingPrincipal),
    },
    {
      label: "Funds Added",
      value: new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 2,
      }).format(fundsAdded),
    },
    {
      label: "Interest Repaid",
      value: new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        minimumFractionDigits: 2,
      }).format(fundsRepaid),
    },
    { label: "Member Since", value: new Date(client.startDate).toLocaleDateString("en-AU", { timeZone: "UTC" }) },
    { label: "Client Code", value: client.clientCode },
  ];

  // Statements list
  const statements = client.statements.map((s) => ({
    id: s.id,
    number: s.statementNumber,
    period: `${new Date(s.periodStart).toLocaleDateString("en-AU", { timeZone: "UTC" })} – ${new Date(s.periodEnd).toLocaleDateString("en-AU", { timeZone: "UTC" })}`,
    type: s.type,
  }));

  return (
    <PortalDashboard
      clientName={client.name}
      currentBalance={Math.round(currentBalance * 100) / 100}
      ytdInterestEarned={Math.round(ytdInterest * 100) / 100}
      openingPrincipal={openingPrincipal}
      ytdReturn={ytdReturn}
      monthlyBreakdown={monthlyBreakdown}
      stats={stats}
      statements={statements}
    />
  );
}
