import { db } from "@/lib/db";
import type { Client, ClientSettings } from "@/generated/prisma/client";

export type StatementData = {
  client: Client & { clientSettings: ClientSettings | null };
  statementNumber: string;
  periodStart: Date;
  periodEnd: Date;
  closingBalance: number;
  previousBalance: number;
  interestEarnedPeriod: number;
  interestRatePeriod: number;
  openingPrincipal: number;
  ytdInterestRate: number;
  ytdInterestEarned: number;
  ytdFundsAdded: number;
  ytdInterestRepaid: number;
  ytdCapitalReduction: number;
  ytdMiscDeductions: number;
  ytdMiscAdditions: number;
  monthlyBreakdown: { month: Date; earned: number; rate: number }[];
  tradingMonths: number;
  avgMonthlyEarned: number;
  avgMonthlyRate: number;
};

export async function assembleStatementData(
  clientId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<StatementData> {
  // Fetch client with settings
  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { clientSettings: true },
  });

  // Get current fiscal year
  const fiscalYear = await db.fiscalYear.findFirstOrThrow({
    where: { isCurrent: true },
  });

  // Fetch all client monthly records for the FY (up to periodEnd), include interestRate relation
  const allFyRecords = await db.clientMonthlyRecord.findMany({
    where: {
      clientId,
      month: {
        gte: fiscalYear.startDate,
        lte: periodEnd,
      },
    },
    include: { interestRate: true },
    orderBy: { month: "asc" },
  });

  // Filter period records (within periodStart-periodEnd)
  const periodRecords = allFyRecords.filter(
    (r) => r.month >= periodStart && r.month <= periodEnd
  );

  // Fetch YTD fund transactions by type
  const ytdTransactions = await db.fundTransaction.findMany({
    where: {
      clientId,
      effectiveDate: {
        gte: fiscalYear.startDate,
        lte: periodEnd,
      },
    },
  });

  // Calculate closing balance (last record in period)
  const lastPeriodRecord = periodRecords[periodRecords.length - 1];
  const closingBalance = lastPeriodRecord
    ? Number(lastPeriodRecord.closingBalance)
    : 0;

  // Calculate previous balance (opening balance of first period record)
  const firstPeriodRecord = periodRecords[0];
  const previousBalance = firstPeriodRecord
    ? Number(firstPeriodRecord.openingBalance)
    : 0;

  // Interest earned for period
  const interestEarnedPeriod = periodRecords.reduce(
    (sum, r) => sum + Number(r.interestEarned),
    0
  );

  // Interest rate for period (average of period rates)
  const interestRatePeriod =
    periodRecords.length > 0
      ? periodRecords.reduce((sum, r) => sum + Number(r.interestRateApplied), 0) /
        periodRecords.length
      : 0;

  // YTD stats
  const ytdInterestEarned = allFyRecords.reduce(
    (sum, r) => sum + Number(r.interestEarned),
    0
  );

  const ytdInterestRate =
    allFyRecords.length > 0
      ? allFyRecords.reduce((sum, r) => sum + Number(r.interestRateApplied), 0) /
        allFyRecords.length
      : 0;

  // YTD fund transactions
  const ytdFundsAdded = ytdTransactions
    .filter((t) => t.type === "DEPOSIT" || t.type === "REBATE")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdInterestRepaid = ytdTransactions
    .filter((t) => t.type === "INTEREST_REPAID")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdCapitalReduction = ytdTransactions
    .filter((t) => t.type === "CAPITAL_REDUCTION")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdMiscDeductions = ytdTransactions
    .filter((t) => t.type === "WITHDRAWAL")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const ytdMiscAdditions = ytdTransactions
    .filter((t) => t.type === "MISCELLANEOUS")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Build monthly breakdown from all records
  const monthlyBreakdown = allFyRecords.map((r) => ({
    month: r.month,
    earned: Number(r.interestEarned),
    rate: Number(r.interestRateApplied),
  }));

  // Calculate trading months and averages
  const tradingMonths = allFyRecords.length;

  const avgMonthlyEarned =
    tradingMonths > 0 ? ytdInterestEarned / tradingMonths : 0;

  const avgMonthlyRate =
    tradingMonths > 0 ? ytdInterestRate : 0;

  return {
    client,
    statementNumber: "",
    periodStart,
    periodEnd,
    closingBalance,
    previousBalance,
    interestEarnedPeriod,
    interestRatePeriod,
    openingPrincipal: Number(client.openingPrincipal),
    ytdInterestRate,
    ytdInterestEarned,
    ytdFundsAdded,
    ytdInterestRepaid,
    ytdCapitalReduction,
    ytdMiscDeductions,
    ytdMiscAdditions,
    monthlyBreakdown,
    tradingMonths,
    avgMonthlyEarned,
    avgMonthlyRate,
  };
}
