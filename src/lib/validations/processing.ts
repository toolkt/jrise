import { z } from "zod";

export const enterInterestRateSchema = z.object({
  month: z.coerce.date(),
  interestRate: z.coerce.number().min(0, "Rate cannot be negative").max(100, "Rate cannot exceed 100%"),
  notes: z.string().optional().default(""),
});

export type EnterInterestRateInput = z.infer<typeof enterInterestRateSchema>;
