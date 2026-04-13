import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { assembleStatementData } from "@/lib/pdf";
import { StatementPDF } from "@/components/statements/statement-pdf";
import { renderToBuffer } from "@react-pdf/renderer";
import React from "react";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ statementId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { statementId } = await params;

  const statement = await db.statement.findUnique({
    where: { id: statementId },
    include: { client: true },
  });

  if (!statement) {
    return new Response("Statement not found", { status: 404 });
  }

  // If client role, verify they own this statement
  if (session.user.role === "CLIENT") {
    const userClient = await db.client.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!userClient || userClient.id !== statement.clientId) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const data = await assembleStatementData(
    statement.clientId,
    statement.periodStart,
    statement.periodEnd
  );

  data.statementNumber = statement.statementNumber;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(StatementPDF, { data }) as any;

  const buffer = await renderToBuffer(element);

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="statement-${statement.statementNumber}.pdf"`,
    },
  });
}
