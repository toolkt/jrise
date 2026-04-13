"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";

export async function getFiscalYears() {
  return db.fiscalYear.findMany({ orderBy: { startDate: "desc" } });
}

export async function createFiscalYear(data: {
  label: string;
  startDate: Date;
  endDate: Date;
}) {
  await requireAdmin();
  await db.fiscalYear.updateMany({ data: { isCurrent: false } });
  await db.fiscalYear.create({
    data: {
      label: data.label,
      startDate: data.startDate,
      endDate: data.endDate,
      isCurrent: true,
    },
  });
  revalidatePath("/admin/settings");
}
