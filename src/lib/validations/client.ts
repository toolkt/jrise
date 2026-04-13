import { z } from "zod";

export const createClientSchema = z.object({
  clientCode: z.string().min(2, "Client code must be at least 2 characters").max(10).toUpperCase(),
  name: z.string().min(1, "Name is required"),
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional().default(""),
  addressLine3: z.string().optional().default(""),
  addressLine4: z.string().optional().default(""),
  email: z.string().email("Invalid email address"),
  mobile: z.string().optional().default(""),
  statementFrequency: z.enum(["MONTHLY", "QUARTERLY"]),
  openingPrincipal: z.coerce.number().positive("Opening principal must be positive"),
  startDate: z.coerce.date(),
});

export const updateClientSchema = createClientSchema.partial();

export const clientSettingsSchema = z.object({
  rebateEnabled: z.boolean(),
  rebatePercentage: z.coerce.number().min(0).max(1),
  withholdingTaxEnabled: z.boolean(),
  withholdingTaxRate: z.coerce.number().min(0).max(1),
  disclaimerType: z.enum(["STD", "FI", "CUSTOM"]),
  customDisclaimerText: z.string().optional().default(""),
  interestRepaidType: z.enum(["NORMAL", "ACCRUED"]),
  cashFlowMode: z.enum(["WITH", "WITHOUT"]),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientSettingsInput = z.infer<typeof clientSettingsSchema>;
