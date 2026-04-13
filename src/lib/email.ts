import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendStatementEmail({
  to,
  clientName,
  statementNumber,
  periodLabel,
  pdfBuffer,
}: {
  to: string;
  clientName: string;
  statementNumber: string;
  periodLabel: string;
  pdfBuffer: Buffer;
}) {
  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "statements@jrise.com.au",
    to,
    subject: `JRISE Statement ${statementNumber} — ${periodLabel}`,
    html: `<p>Dear ${clientName},</p>
      <p>Please find attached your JRISE investment statement (${statementNumber}) for the period ${periodLabel}.</p>
      <p>You can also view your statements online by logging into your client portal.</p>
      <br/><p>Kind regards,<br/>JRISE Smart Trading Pty Limited</p>
      <p style="font-size:11px;color:#888;">ACN: 627 266 337 · PO Box 4399 North Rocks NSW 2151</p>`,
    attachments: [{ filename: `${statementNumber}.pdf`, content: pdfBuffer }],
  });
  if (error) throw new Error(`Email failed: ${error.message}`);
}
