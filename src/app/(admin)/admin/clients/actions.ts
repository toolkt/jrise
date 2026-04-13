"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import bcrypt from "bcryptjs";
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
      user: true,
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
      cashFlowMode: data.cashFlowMode,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
  return settings;
}

export async function enablePortalAccess(
  clientId: string,
  email: string,
  password: string
) {
  await requireAdmin();

  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });
  if (client.userId) throw new Error("Portal access already enabled");

  const nameParts = client.name.split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "CLIENT",
      firstName,
      lastName,
    },
  });

  await db.client.update({
    where: { id: clientId },
    data: { userId: user.id },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function resetPortalPassword(
  clientId: string,
  newPassword: string
) {
  await requireAdmin();

  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { user: true },
  });
  if (!client.userId || !client.user) throw new Error("No portal access");

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: client.userId },
    data: { passwordHash },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function disablePortalAccess(clientId: string) {
  await requireAdmin();

  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });
  if (!client.userId) throw new Error("No portal access");

  await db.user.update({
    where: { id: client.userId },
    data: { isActive: false },
  });

  await db.client.update({
    where: { id: clientId },
    data: { userId: null },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}
