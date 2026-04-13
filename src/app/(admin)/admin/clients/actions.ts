"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import {
  createClientSchema,
  updateClientSchema,
  clientSettingsSchema,
  type CreateClientInput,
  type UpdateClientInput,
  type ClientSettingsInput,
} from "@/lib/validations/client";

export async function getClients() {
  const clients = await db.client.findMany({
    include: {
      clientSettings: true,
    },
    orderBy: { name: "asc" },
  });
  return clients;
}

export async function getClient(id: string) {
  const client = await db.client.findUnique({
    where: { id },
    include: {
      clientSettings: true,
      clientMonthlyRecords: {
        orderBy: { month: "desc" },
      },
      fundTransactions: {
        orderBy: { effectiveDate: "desc" },
      },
      statements: {
        orderBy: { generatedAt: "desc" },
      },
    },
  });
  return client;
}

export async function createClient(input: CreateClientInput) {
  await requireAdmin();
  const data = createClientSchema.parse(input);

  const client = await db.client.create({
    data: {
      clientCode: data.clientCode,
      name: data.name,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 ?? "",
      addressLine3: data.addressLine3 ?? "",
      addressLine4: data.addressLine4 ?? "",
      email: data.email,
      mobile: data.mobile ?? "",
      statementFrequency: data.statementFrequency,
      openingPrincipal: data.openingPrincipal,
      startDate: data.startDate,
      clientSettings: {
        create: {
          rebateEnabled: false,
          rebatePercentage: 0,
          withholdingTaxEnabled: false,
          withholdingTaxRate: 0,
          disclaimerType: "STD",
          customDisclaimerText: "",
          interestRepaidType: "NORMAL",
        },
      },
    },
  });

  revalidatePath("/admin/clients");
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  await requireAdmin();
  const data = updateClientSchema.parse(input);

  const client = await db.client.update({
    where: { id },
    data: {
      ...(data.clientCode !== undefined && { clientCode: data.clientCode }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
      ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
      ...(data.addressLine3 !== undefined && { addressLine3: data.addressLine3 }),
      ...(data.addressLine4 !== undefined && { addressLine4: data.addressLine4 }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.mobile !== undefined && { mobile: data.mobile }),
      ...(data.statementFrequency !== undefined && { statementFrequency: data.statementFrequency }),
      ...(data.openingPrincipal !== undefined && { openingPrincipal: data.openingPrincipal }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
    },
  });

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return client;
}

export async function updateClientSettings(clientId: string, input: ClientSettingsInput) {
  await requireAdmin();
  const data = clientSettingsSchema.parse(input);

  const settings = await db.clientSettings.update({
    where: { clientId },
    data: {
      rebateEnabled: data.rebateEnabled,
      rebatePercentage: data.rebatePercentage,
      withholdingTaxEnabled: data.withholdingTaxEnabled,
      withholdingTaxRate: data.withholdingTaxRate,
      disclaimerType: data.disclaimerType,
      customDisclaimerText: data.customDisclaimerText ?? "",
      interestRepaidType: data.interestRepaidType,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  return settings;
}
