import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EyeIcon, DownloadIcon } from "lucide-react";

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    ANNUAL: "Annual",
    CUSTOM: "Custom",
    CLOSE: "Close",
  };
  return map[type] ?? type;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(date));
}

export default async function PortalStatementsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const client = await db.client.findFirst({
    where: { userId: user.id },
    include: {
      statements: {
        orderBy: { periodStart: "desc" },
      },
    },
  });

  if (!client) redirect("/login");

  const statements = client.statements;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">My Statements</h1>
        <p className="text-muted-foreground text-sm">
          Download and view your investment statements
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Statement No.</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {statements.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-muted-foreground py-8"
                >
                  No statements available yet.
                </TableCell>
              </TableRow>
            ) : (
              statements.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <span className="font-mono text-sm">
                      {s.statementNumber}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabel(s.type)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(s.periodStart)} – {formatDate(s.periodEnd)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(s.generatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <a
                        href={`/api/pdf/${s.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="View PDF"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </a>
                      <a
                        href={`/api/pdf/${s.id}`}
                        download={`${s.statementNumber}.pdf`}
                        title="Download PDF"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                      >
                        <DownloadIcon className="h-4 w-4" />
                      </a>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
