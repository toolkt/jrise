import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";

const EXCEL_PATH =
  "/Volumes/Workspace/Development/CHAY/JRISE Statement MASTER File FY 2025-26 (Chay).xlsx";

const MONTH_MAP: Record<string, string> = {
  JUL: "2025-07-01",
  AUG: "2025-08-01",
  SEP: "2025-09-01",
  OCT: "2025-10-01",
  NOV: "2025-11-01",
  DEC: "2025-12-01",
  JAN: "2026-01-01",
  FEB: "2026-02-01",
  MAR: "2026-03-01",
  APR: "2026-04-01",
  MAY: "2026-05-01",
  JUN: "2026-06-01",
};

const SKIP_SUFFIXES = new Set(["Q1", "Q2", "Q3", "Q4", "EOFY"]);

/** Extract a numeric value from a cell that may contain a formula result object */
function getCellNumber(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && "result" in (v as object)) {
    const r = (v as { result: unknown }).result;
    if (typeof r === "number") return r;
    // Formula error (e.g. #DIV/0!) – treat as null
    return null;
  }
  return null;
}

/** Extract a string value from a cell that may contain a formula result */
function getCellString(cell: ExcelJS.Cell): string | null {
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "object" && "result" in (v as object)) {
    const r = (v as { result: unknown }).result;
    if (typeof r === "string") return r.trim() || null;
    return null;
  }
  return null;
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // ── 1. Admin user ──────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@jrise.com.au" },
    update: {},
    create: {
      email: "admin@jrise.com.au",
      passwordHash,
      role: "ADMIN",
      firstName: "Jerrold",
      lastName: "Admin",
    },
  });
  console.log("✓ Admin user created:", admin.email);

  // ── 2. Fiscal year ─────────────────────────────────────────────────────────
  const fy = await prisma.fiscalYear.upsert({
    where: { id: "fy-2025-26" },
    update: {},
    create: {
      id: "fy-2025-26",
      label: "FY 2025-26",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });
  console.log("✓ Fiscal year created:", fy.label);

  // ── 3. Read Excel ──────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_PATH);

  // ── 4. Client List sheet ───────────────────────────────────────────────────
  const clSheet = wb.getWorksheet("Client List");
  if (!clSheet) throw new Error("Could not find 'Client List' worksheet");

  interface ClientRow {
    cid: string;
    name: string;
    addressLine1: string;
    addressLine2: string | null;
    addressLine3: string | null;
    addressLine4: string | null;
    email: string;
    mobile: string | null;
  }

  const clientRows: ClientRow[] = [];

  // Rows 3+ (skip header row 1 and category row 2)
  clSheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 3) return;
    const cid = getCellString(row.getCell(1));
    if (!cid) return;

    const name = getCellString(row.getCell(2)) ?? "";
    const addr1 = getCellString(row.getCell(3)) ?? "";
    const addr2 = getCellString(row.getCell(4));
    const addr3 = getCellString(row.getCell(5));
    const addr4 = getCellString(row.getCell(6));
    const email = getCellString(row.getCell(7)) ?? `${cid.toLowerCase()}@jrise.com.au`;
    const mobile = getCellString(row.getCell(8));

    clientRows.push({ cid, name, addressLine1: addr1, addressLine2: addr2, addressLine3: addr3, addressLine4: addr4, email, mobile });
  });

  console.log(`✓ Parsed ${clientRows.length} clients from Client List sheet`);

  // ── 5. FY 25-26 Data sheet – summary rows (opening principals) ─────────────
  const fySheet = wb.getWorksheet("FY 25-26 Data");
  if (!fySheet) throw new Error("Could not find 'FY 25-26 Data' worksheet");

  // Rows 3-6: CID, Name, Opening Principal
  const openingPrincipals: Record<string, number> = {};
  for (let r = 3; r <= 6; r++) {
    const row = fySheet.getRow(r);
    const cid = getCellString(row.getCell(1));
    const op = getCellNumber(row.getCell(3));
    if (cid && op !== null) {
      openingPrincipals[cid] = op;
    }
  }
  console.log("✓ Opening principals:", openingPrincipals);

  // ── 6. Create clients ──────────────────────────────────────────────────────
  const clientIdMap: Record<string, string> = {}; // cid -> prisma id

  for (const cr of clientRows) {
    const op = openingPrincipals[cr.cid] ?? 0;
    const client = await prisma.client.upsert({
      where: { clientCode: cr.cid },
      update: { openingPrincipal: op },
      create: {
        clientCode: cr.cid,
        name: cr.name,
        addressLine1: cr.addressLine1,
        addressLine2: cr.addressLine2,
        addressLine3: cr.addressLine3,
        addressLine4: cr.addressLine4,
        email: cr.email,
        mobile: cr.mobile,
        statementFrequency: "MONTHLY",
        openingPrincipal: op,
        startDate: new Date("2025-07-01"),
      },
    });
    clientIdMap[cr.cid] = client.id;
    console.log(`  ✓ Client ${cr.cid} (${cr.name}) – opening principal: ${op}`);

    // Create default client settings
    await prisma.clientSettings.upsert({
      where: { clientId: client.id },
      update: {},
      create: { clientId: client.id },
    });
  }

  // ── 7. Parse per-client monthly data rows ─────────────────────────────────
  interface MonthlyRow {
    cid: string;
    monthKey: string; // e.g. "JUL"
    startBalance: number;
    finishBalance: number;
    earned: number;
    fundsAdded: number | null;
    interestRepaid: number | null;
    capitalReduction: number | null;
    interestRate: number; // decimal e.g. 0.01113
  }

  const monthlyRows: MonthlyRow[] = [];

  fySheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber < 16) return; // skip header rows

    const cellA = getCellString(row.getCell(1));
    if (!cellA) return;

    // Format: "{CID} {MONTH}" e.g. "ATV JUL"
    const parts = cellA.split(" ");
    if (parts.length < 2) return;
    const cid = parts[0];
    const monthKey = parts[1];

    // Skip quarterly and EOFY rows
    if (SKIP_SUFFIXES.has(monthKey)) return;

    // Must be a known month
    if (!(monthKey in MONTH_MAP)) return;

    const startBalance = getCellNumber(row.getCell(2));
    const finishBalance = getCellNumber(row.getCell(3));
    const earned = getCellNumber(row.getCell(4));
    const fundsAdded = getCellNumber(row.getCell(5));
    const interestRepaid = getCellNumber(row.getCell(6));
    const capitalReduction = getCellNumber(row.getCell(7));
    const interestRate = getCellNumber(row.getCell(8));

    // Only include rows with valid balance data
    if (startBalance === null || finishBalance === null || interestRate === null) return;

    monthlyRows.push({
      cid,
      monthKey,
      startBalance,
      finishBalance,
      earned: earned ?? finishBalance - startBalance,
      fundsAdded,
      interestRepaid,
      capitalReduction,
      interestRate,
    });
  });

  console.log(`✓ Parsed ${monthlyRows.length} monthly data rows`);

  // ── 8. Create MonthlyInterestRate records ──────────────────────────────────
  // One per month, rate from first client's data for that month
  const monthRateMap: Record<string, string> = {}; // monthDate -> interestRateId

  // Collect unique months and their rates (from whichever client comes first)
  const monthRates: Record<string, number> = {};
  for (const mr of monthlyRows) {
    const dateStr = MONTH_MAP[mr.monthKey];
    if (!(dateStr in monthRates)) {
      monthRates[dateStr] = mr.interestRate;
    }
  }

  for (const [dateStr, rate] of Object.entries(monthRates)) {
    const monthDate = new Date(dateStr);
    const mir = await prisma.monthlyInterestRate.upsert({
      where: { fiscalYearId_month: { fiscalYearId: fy.id, month: monthDate } },
      update: {},
      create: {
        fiscalYearId: fy.id,
        month: monthDate,
        interestRate: rate,
        enteredBy: admin.id,
        isLocked: true,
        notes: `Imported from Excel – FY 2025-26`,
      },
    });
    monthRateMap[dateStr] = mir.id;
  }

  console.log(`✓ Created ${Object.keys(monthRateMap).length} monthly interest rate records`);

  // ── 9. Create ClientMonthlyRecord records ──────────────────────────────────
  // First compute total opening balance per month (sum of all clients' start balances)
  const monthTotals: Record<string, number> = {};
  for (const mr of monthlyRows) {
    const dateStr = MONTH_MAP[mr.monthKey];
    monthTotals[dateStr] = (monthTotals[dateStr] ?? 0) + mr.startBalance;
  }

  let cmrCount = 0;
  for (const mr of monthlyRows) {
    const clientId = clientIdMap[mr.cid];
    if (!clientId) {
      console.warn(`  ⚠ No client found for CID ${mr.cid}`);
      continue;
    }

    const dateStr = MONTH_MAP[mr.monthKey];
    const rateId = monthRateMap[dateStr];
    if (!rateId) {
      console.warn(`  ⚠ No interest rate record for ${dateStr}`);
      continue;
    }

    const monthDate = new Date(dateStr);
    const total = monthTotals[dateStr] ?? 1;
    const percentageShare = total > 0 ? mr.startBalance / total : 0;

    await prisma.clientMonthlyRecord.upsert({
      where: { clientId_month: { clientId, month: monthDate } },
      update: {},
      create: {
        clientId,
        interestRateId: rateId,
        month: monthDate,
        openingBalance: mr.startBalance,
        closingBalance: mr.finishBalance,
        interestEarned: mr.earned,
        interestRateApplied: mr.interestRate,
        percentageShare,
      },
    });
    cmrCount++;
  }

  console.log(`✓ Created ${cmrCount} client monthly records`);

  // ── 10. Create FundTransaction records ─────────────────────────────────────
  let txCount = 0;
  for (const mr of monthlyRows) {
    const clientId = clientIdMap[mr.cid];
    if (!clientId) continue;

    const effectiveDate = new Date(MONTH_MAP[mr.monthKey]);

    if (mr.fundsAdded && mr.fundsAdded > 0) {
      await prisma.fundTransaction.create({
        data: {
          clientId,
          type: "DEPOSIT",
          amount: mr.fundsAdded,
          effectiveDate,
          description: `Funds added – ${mr.monthKey} ${effectiveDate.getFullYear()}`,
          enteredBy: admin.id,
        },
      });
      txCount++;
    }

    if (mr.interestRepaid && mr.interestRepaid > 0) {
      await prisma.fundTransaction.create({
        data: {
          clientId,
          type: "INTEREST_REPAID",
          amount: mr.interestRepaid,
          effectiveDate,
          description: `Interest repaid – ${mr.monthKey} ${effectiveDate.getFullYear()}`,
          enteredBy: admin.id,
        },
      });
      txCount++;
    }

    if (mr.capitalReduction && mr.capitalReduction > 0) {
      await prisma.fundTransaction.create({
        data: {
          clientId,
          type: "CAPITAL_REDUCTION",
          amount: mr.capitalReduction,
          effectiveDate,
          description: `Capital reduction – ${mr.monthKey} ${effectiveDate.getFullYear()}`,
          enteredBy: admin.id,
        },
      });
      txCount++;
    }
  }

  console.log(`✓ Created ${txCount} fund transactions`);

  // ── Summary ────────────────────────────────────────────────────────────────
  const clientCount = await prisma.client.count();
  const cmrTotal = await prisma.clientMonthlyRecord.count();
  const mirTotal = await prisma.monthlyInterestRate.count();
  const txTotal = await prisma.fundTransaction.count();

  console.log("\n── Seed complete ──────────────────────────────────────────");
  console.log(`  Clients:               ${clientCount}`);
  console.log(`  Monthly interest rates: ${mirTotal}`);
  console.log(`  Client monthly records: ${cmrTotal}`);
  console.log(`  Fund transactions:      ${txTotal}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
