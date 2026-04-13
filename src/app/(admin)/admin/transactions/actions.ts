"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { createTransactionSchema, type CreateTransactionInput } from "@/lib/validations/transaction";

async function isMonthLocked(date: Date): Promise<boolean> {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const rate = await db.monthlyInterestRate.findFirst({
    where: { month: monthStart, isLocked: true },
  });
  return !!rate;
}

export async function getTransactions(clientId?: string) {
  return db.fundTransaction.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: true },
    orderBy: { effectiveDate: "desc" },
  });
}

export async function createTransaction(input: CreateTransactionInput) {
  const user = await requireAdmin();
  const data = createTransactionSchema.parse(input);

  const transaction = await db.fundTransaction.create({
    data: {
      clientId: data.clientId,
      type: data.type,
      amount: data.amount,
      effectiveDate: data.effectiveDate,
      description: data.description || "",
      notes: data.notes || null,
      enteredBy: user.id,
    },
  });

  revalidatePath("/admin/transactions");
  revalidatePath("/admin/processing");
  return transaction;
}

export async function updateTransaction(id: string, input: CreateTransactionInput) {
  const user = await requireAdmin();
  const data = createTransactionSchema.parse(input);

  const existing = await db.fundTransaction.findUniqueOrThrow({ where: { id } });
  if (await isMonthLocked(new Date(existing.effectiveDate))) {
    throw new Error("Cannot edit transaction in a locked month");
  }

  const transaction = await db.fundTransaction.update({
    where: { id },
    data: {
      clientId: data.clientId,
      type: data.type,
      amount: data.amount,
      effectiveDate: data.effectiveDate,
      description: data.description || "",
      notes: data.notes || "",
    },
  });

  revalidatePath("/admin/transactions");
  revalidatePath("/admin/processing");
  return transaction;
}

export async function deleteTransaction(id: string) {
  await requireAdmin();

  const existing = await db.fundTransaction.findUniqueOrThrow({ where: { id } });
  if (await isMonthLocked(new Date(existing.effectiveDate))) {
    throw new Error("Cannot delete transaction in a locked month");
  }

  await db.fundTransaction.delete({ where: { id } });
  revalidatePath("/admin/transactions");
  revalidatePath("/admin/processing");
}
