"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { calculateMonthlyRecords } from "@/lib/calculations";

export async function getProcessingStatus() {
  const fiscalYear = await db.fiscalYear.findFirstOrThrow({
    where: { isCurrent: true },
  });

  const rates = await db.monthlyInterestRate.findMany({
    where: { fiscalYearId: fiscalYear.id },
    orderBy: { month: "asc" },
  });

  return { fiscalYear, rates };
}

export async function getMonthPreview(monthDate: Date) {
  const clients = await db.client.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  const monthStart = new Date(monthDate);
  monthStart.setUTCHours(0, 0, 0, 0);

  // For each client, find most recent monthly record before this month
  const previousBalances = await Promise.all(
    clients.map(async (client) => {
      const lastRecord = await db.clientMonthlyRecord.findFirst({
        where: {
          clientId: client.id,
          month: { lt: monthStart },
        },
        orderBy: { month: "desc" },
      });

      const balance = lastRecord
        ? Number(lastRecord.closingBalance)
        : Number(client.openingPrincipal);

      return {
        clientId: client.id,
        balance,
      };
    })
  );

  // Fetch all fund transactions for this month
  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

  const rawTransactions = await db.fundTransaction.findMany({
    where: {
      effectiveDate: {
        gte: monthStart,
        lt: monthEnd,
      },
    },
    include: { client: true },
    orderBy: { effectiveDate: "asc" },
  });

  const transactions = rawTransactions.map((tx) => ({
    clientId: tx.clientId,
    type: tx.type,
    amount: Number(tx.amount),
  }));

  const clientList = clients.map((c) => ({
    id: c.id,
    name: c.name,
    clientCode: c.clientCode,
    previousBalance:
      previousBalances.find((b) => b.clientId === c.id)?.balance ?? 0,
  }));

  return {
    clients: clientList,
    previousBalances,
    transactions,
    rawTransactions,
  };
}

export async function processMonth(
  monthDate: Date,
  interestRate: number,
  notes: string
) {
  const user = await requireAdmin();

  const fiscalYear = await db.fiscalYear.findFirstOrThrow({
    where: { isCurrent: true },
  });

  // Normalise to first-of-month UTC date
  const monthStart = new Date(monthDate);
  monthStart.setUTCHours(0, 0, 0, 0);

  // Check if month is already locked
  const existingRate = await db.monthlyInterestRate.findUnique({
    where: {
      fiscalYearId_month: {
        fiscalYearId: fiscalYear.id,
        month: monthStart,
      },
    },
  });

  if (existingRate?.isLocked) {
    throw new Error("This month has already been processed and locked.");
  }

  // Get preview data
  const { previousBalances, transactions } = await getMonthPreview(monthStart);

  // Calculate records (interestRate comes as percentage, divide by 100)
  const calculatedRecords = calculateMonthlyRecords(
    previousBalances,
    interestRate / 100,
    transactions
  );

  // Upsert the monthly interest rate record (mark isLocked = true)
  const rateRecord = await db.monthlyInterestRate.upsert({
    where: {
      fiscalYearId_month: {
        fiscalYearId: fiscalYear.id,
        month: monthStart,
      },
    },
    update: {
      interestRate: interestRate / 100,
      notes: notes || null,
      isLocked: true,
      enteredBy: user.id,
    },
    create: {
      fiscalYearId: fiscalYear.id,
      month: monthStart,
      interestRate: interestRate / 100,
      notes: notes || null,
      enteredBy: user.id,
      isLocked: true,
    },
  });

  // Upsert client monthly records for each client
  await Promise.all(
    calculatedRecords.map((record) =>
      db.clientMonthlyRecord.upsert({
        where: {
          clientId_month: {
            clientId: record.clientId,
            month: monthStart,
          },
        },
        update: {
          interestRateId: rateRecord.id,
          openingBalance: record.openingBalance,
          closingBalance: record.closingBalance,
          interestEarned: record.interestEarned,
          interestRateApplied: record.interestRateApplied,
          percentageShare: record.percentageShare,
        },
        create: {
          clientId: record.clientId,
          interestRateId: rateRecord.id,
          month: monthStart,
          openingBalance: record.openingBalance,
          closingBalance: record.closingBalance,
          interestEarned: record.interestEarned,
          interestRateApplied: record.interestRateApplied,
          percentageShare: record.percentageShare,
        },
      })
    )
  );

  revalidatePath("/admin/processing");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/clients");

  return { success: true };
}
