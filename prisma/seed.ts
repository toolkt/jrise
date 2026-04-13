import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
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

  console.log("Seed complete: admin user and FY 2025-26 created");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
