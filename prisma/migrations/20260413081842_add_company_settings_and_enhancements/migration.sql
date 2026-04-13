-- CreateEnum
CREATE TYPE "CashFlowMode" AS ENUM ('WITH', 'WITHOUT');

-- AlterEnum
ALTER TYPE "DisclaimerType" ADD VALUE 'FI';

-- AlterTable
ALTER TABLE "client_settings" ADD COLUMN     "cash_flow_mode" "CashFlowMode" NOT NULL DEFAULT 'WITHOUT';

-- CreateTable
CREATE TABLE "company_settings" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL DEFAULT 'JRISE Smart Trading Pty Limited',
    "acn" TEXT NOT NULL DEFAULT '627 266 337',
    "address_line1" TEXT NOT NULL DEFAULT 'PO Box 4399 North Rocks NSW 2151',
    "address_line2" TEXT,
    "email" TEXT NOT NULL DEFAULT 'jerrold@jrise.com.au',
    "phone" TEXT,
    "std_disclaimer_text" TEXT NOT NULL DEFAULT 'Your statement does NOT incorporate any applicable taxes. We strongly recommend seeking guidance from a certified accountant or financial advisor to assess any potential tax liability or obligations you may incur.',
    "fi_disclaimer_text" TEXT NOT NULL DEFAULT 'Your statement includes a 10% Foreign Investor Withholding Tax. JRISE Smart Trading Pty Ltd will pay this amount to the Australian Taxation Office (ATO) on your behalf. However, we still strongly recommend seeking guidance from a certified accountant or financial advisor to assess any further potential tax liabilities or obligations you may incur.',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_settings_pkey" PRIMARY KEY ("id")
);
