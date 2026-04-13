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

export async function getCompanySettings() {
  let settings = await db.companySettings.findFirst();
  if (!settings) {
    settings = await db.companySettings.create({ data: { id: "default" } });
  }
  return settings;
}

export async function updateCompanySettings(data: {
  companyName: string;
  acn: string;
  addressLine1: string;
  addressLine2?: string;
  email: string;
  phone?: string;
  stdDisclaimerText: string;
  fiDisclaimerText: string;
}) {
  await requireAdmin();

  const settings = await getCompanySettings();

  await db.companySettings.update({
    where: { id: settings.id },
    data: {
      companyName: data.companyName,
      acn: data.acn,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      email: data.email,
      phone: data.phone || null,
      stdDisclaimerText: data.stdDisclaimerText,
      fiDisclaimerText: data.fiDisclaimerText,
    },
  });

  revalidatePath("/admin/settings");
}
