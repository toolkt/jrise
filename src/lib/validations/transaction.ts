import { z } from "zod";

export const createTransactionSchema = z.object({
  clientId: z.string().uuid(),
  type: z.enum(["DEPOSIT", "WITHDRAWAL", "INTEREST_REPAID", "CAPITAL_REDUCTION", "REBATE", "MISCELLANEOUS"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  effectiveDate: z.coerce.date(),
  description: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
