"use server";

import { revalidatePath } from "next/cache";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { assembleStatementData } from "@/lib/pdf";
import { generateStatementNumber } from "@/lib/statement-number";
import { sendStatementEmail } from "@/lib/email";
import { StatementPDF } from "@/components/statements/statement-pdf";
import type { StatementType } from "@/generated/prisma/client";

export async function getStatements() {
  const statements = await db.statement.findMany({
    include: { client: true },
    orderBy: { generatedAt: "desc" },
  });
  return statements;
}

export async function generateStatement({
  clientId,
  type,
  periodStart,
  periodEnd,
  quarter,
}: {
  clientId: string;
  type: StatementType;
  periodStart: Date;
  periodEnd: Date;
  quarter?: number;
}) {
  await requireAdmin();

  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });

  const existingCount = await db.statement.count({ where: { clientId } });
  const sequence = existingCount + 1;

  const statementNumber = generateStatementNumber({
    type,
    clientCode: client.clientCode,
    periodEnd,
    quarter,
    sequence,
    fiscalYearLabel: "2526",
  });

  const data = await assembleStatementData(clientId, periodStart, periodEnd);
  const closingBalance = data.closingBalance;

  const statement = await db.statement.create({
    data: {
      clientId,
      statementNumber,
      type,
      periodStart,
      periodEnd,
      closingBalance,
      generatedAt: new Date(),
    },
  });

  revalidatePath("/admin/statements");
  return statement;
}

export async function sendStatement(statementId: string) {
  await requireAdmin();

  const statement = await db.statement.findUniqueOrThrow({
    where: { id: statementId },
    include: { client: true },
  });

  try {
    const data = await assembleStatementData(
      statement.clientId,
      statement.periodStart,
      statement.periodEnd
    );
    data.statementNumber = statement.statementNumber;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(StatementPDF, { data }) as any;
    const buffer = await renderToBuffer(element);

    const periodLabel = `${statement.periodStart.toLocaleDateString("en-AU")} – ${statement.periodEnd.toLocaleDateString("en-AU")}`;

    await sendStatementEmail({
      to: statement.client.email,
      clientName: statement.client.name,
      statementNumber: statement.statementNumber,
      periodLabel,
      pdfBuffer: Buffer.from(buffer),
    });

    await db.statement.update({
      where: { id: statementId },
      data: { emailStatus: "SENT", emailedAt: new Date() },
    });
  } catch (err) {
    await db.statement.update({
      where: { id: statementId },
      data: { emailStatus: "FAILED" },
    });
    throw err;
  }

  revalidatePath("/admin/statements");
}
