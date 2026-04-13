-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'CLIENT');

-- CreateEnum
CREATE TYPE "StatementFrequency" AS ENUM ('MONTHLY', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "DisclaimerType" AS ENUM ('STD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InterestRepaidType" AS ENUM ('NORMAL', 'ACCRUED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'INTEREST_REPAID', 'CAPITAL_REDUCTION', 'REBATE', 'MISCELLANEOUS');

-- CreateEnum
CREATE TYPE "StatementType" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM', 'CLOSE');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "client_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "address_line3" TEXT,
    "address_line4" TEXT,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "statement_frequency" "StatementFrequency" NOT NULL,
    "opening_principal" DECIMAL(15,2) NOT NULL,
    "start_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_settings" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "rebate_enabled" BOOLEAN NOT NULL DEFAULT false,
    "rebate_percentage" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "withholding_tax_enabled" BOOLEAN NOT NULL DEFAULT false,
    "withholding_tax_rate" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "disclaimer_type" "DisclaimerType" NOT NULL DEFAULT 'STD',
    "custom_disclaimer_text" TEXT,
    "interest_repaid_type" "InterestRepaidType" NOT NULL DEFAULT 'NORMAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_years" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fiscal_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monthly_interest_rates" (
    "id" TEXT NOT NULL,
    "fiscal_year_id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "interest_rate" DECIMAL(8,6) NOT NULL,
    "notes" TEXT,
    "entered_by" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monthly_interest_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_monthly_records" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "interest_rate_id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "opening_balance" DECIMAL(15,2) NOT NULL,
    "closing_balance" DECIMAL(15,2) NOT NULL,
    "interest_earned" DECIMAL(15,2) NOT NULL,
    "interest_rate_applied" DECIMAL(8,6) NOT NULL,
    "percentage_share" DECIMAL(8,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_monthly_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fund_transactions" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "effective_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "entered_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fund_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statements" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "statement_number" TEXT NOT NULL,
    "type" "StatementType" NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "closing_balance" DECIMAL(15,2) NOT NULL,
    "pdf_path" TEXT,
    "generated_at" TIMESTAMP(3) NOT NULL,
    "emailed_at" TIMESTAMP(3),
    "email_status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_user_id_key" ON "clients"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "clients_client_code_key" ON "clients"("client_code");

-- CreateIndex
CREATE UNIQUE INDEX "client_settings_client_id_key" ON "client_settings"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_interest_rates_fiscal_year_id_month_key" ON "monthly_interest_rates"("fiscal_year_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "client_monthly_records_client_id_month_key" ON "client_monthly_records"("client_id", "month");

-- CreateIndex
CREATE UNIQUE INDEX "statements_statement_number_key" ON "statements"("statement_number");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_settings" ADD CONSTRAINT "client_settings_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_interest_rates" ADD CONSTRAINT "monthly_interest_rates_fiscal_year_id_fkey" FOREIGN KEY ("fiscal_year_id") REFERENCES "fiscal_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monthly_interest_rates" ADD CONSTRAINT "monthly_interest_rates_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_monthly_records" ADD CONSTRAINT "client_monthly_records_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_monthly_records" ADD CONSTRAINT "client_monthly_records_interest_rate_id_fkey" FOREIGN KEY ("interest_rate_id") REFERENCES "monthly_interest_rates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_transactions" ADD CONSTRAINT "fund_transactions_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fund_transactions" ADD CONSTRAINT "fund_transactions_entered_by_fkey" FOREIGN KEY ("entered_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements" ADD CONSTRAINT "statements_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
