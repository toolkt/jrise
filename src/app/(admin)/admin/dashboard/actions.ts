import { db } from "@/lib/db";

export type MonthlyTotal = {
  month: Date;
  label: string;
  totalInterest: number;
  interestRate: number;
};

export type ClientSummary = {
  id: string;
  name: string;
  clientCode: string;
  openingPrincipal: number;
  currentBalance: number;
  totalInterest: number;
  ytdReturn: number;
};

export type ShareDistribution = {
  name: string;
  value: number;
  percentage: number;
};

export type DashboardData = {
  fiscalYear: { id: string; label: string; startDate: Date; endDate: Date };
  totalFundBalance: number;
  activeClientCount: number;
  ytdInterest: number;
  pendingStatements: number;
  monthlyTotals: MonthlyTotal[];
  clientSummaries: ClientSummary[];
  shareDistribution: ShareDistribution[];
};

export async function getDashboardData(): Promise<DashboardData | null> {
  const fiscalYear = await db.fiscalYear.findFirst({
    where: { isCurrent: true },
  });

  if (!fiscalYear) return null;

  const [activeClients, interestRates, pendingStatements] = await Promise.all([
    db.client.findMany({
      where: { isActive: true },
      include: {
        clientMonthlyRecords: {
          where: {
            month: {
              gte: fiscalYear.startDate,
              lte: fiscalYear.endDate,
            },
          },
          orderBy: { month: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.monthlyInterestRate.findMany({
      where: {
        fiscalYearId: fiscalYear.id,
        isLocked: true,
      },
      orderBy: { month: "asc" },
    }),
    db.statement.count({
      where: {
        emailStatus: "PENDING",
      },
    }),
  ]);

  // Build monthly totals
  const monthlyTotals: MonthlyTotal[] = interestRates.map((rate) => {
    const rateMonth = new Date(rate.month);
    const totalInterest = activeClients.reduce((sum, client) => {
      const record = client.clientMonthlyRecords.find(
        (r) => new Date(r.month).getTime() === rateMonth.getTime()
      );
      return sum + (record ? Number(record.interestEarned) : 0);
    }, 0);

    const label = rateMonth.toLocaleDateString("en-AU", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });

    return {
      month: rateMonth,
      label,
      totalInterest: Math.round(totalInterest * 100) / 100,
      interestRate: Number(rate.interestRate) * 100,
    };
  });

  // Compute per-client summaries
  const clientSummaries: ClientSummary[] = activeClients.map((client) => {
    const records = client.clientMonthlyRecords;
    const latestRecord = records[records.length - 1];
    const currentBalance = latestRecord
      ? Number(latestRecord.closingBalance)
      : Number(client.openingPrincipal);
    const totalInterest = records.reduce(
      (sum, r) => sum + Number(r.interestEarned),
      0
    );
    const openingPrincipal = Number(client.openingPrincipal);
    const ytdReturn =
      openingPrincipal > 0 ? (totalInterest / openingPrincipal) * 100 : 0;

    return {
      id: client.id,
      name: client.name,
      clientCode: client.clientCode,
      openingPrincipal,
      currentBalance: Math.round(currentBalance * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      ytdReturn: Math.round(ytdReturn * 100) / 100,
    };
  });

  const totalFundBalance = clientSummaries.reduce(
    (sum, c) => sum + c.currentBalance,
    0
  );

  const ytdInterest = clientSummaries.reduce(
    (sum, c) => sum + c.totalInterest,
    0
  );

  // Share distribution
  const shareDistribution: ShareDistribution[] = clientSummaries.map((c) => ({
    name: c.name,
    value: c.currentBalance,
    percentage:
      totalFundBalance > 0
        ? Math.round((c.currentBalance / totalFundBalance) * 10000) / 100
        : 0,
  }));

  return {
    fiscalYear: {
      id: fiscalYear.id,
      label: fiscalYear.label,
      startDate: fiscalYear.startDate,
      endDate: fiscalYear.endDate,
    },
    totalFundBalance: Math.round(totalFundBalance * 100) / 100,
    activeClientCount: activeClients.length,
    ytdInterest: Math.round(ytdInterest * 100) / 100,
    pendingStatements,
    monthlyTotals,
    clientSummaries,
    shareDistribution,
  };
}
