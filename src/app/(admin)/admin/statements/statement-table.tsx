"use client";

import { useState } from "react";
import { toast } from "sonner";
import { EyeIcon, DownloadIcon, MailIcon } from "lucide-react";
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
import { sendStatement } from "./actions";
import type { getStatements } from "./actions";

type Statement = Awaited<ReturnType<typeof getStatements>>[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function emailStatusVariant(status: string): "default" | "destructive" | "secondary" {
  if (status === "SENT") return "default";
  if (status === "FAILED") return "destructive";
  return "secondary";
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    ANNUAL: "Annual",
    CUSTOM: "Custom",
    CLOSE: "Close",
  };
  return map[type] ?? type;
}

interface StatementTableProps {
  statements: Statement[];
}

export function StatementTable({ statements }: StatementTableProps) {
  const [sending, setSending] = useState<string | null>(null);

  async function handleSend(statementId: string) {
    setSending(statementId);
    try {
      await sendStatement(statementId);
      toast.success("Statement emailed successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSending(null);
    }
  }

  if (statements.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Statement No.</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Email Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                No statements found. Generate a statement to get started.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Statement No.</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Generated</TableHead>
            <TableHead>Email Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((statement) => (
            <TableRow key={statement.id}>
              <TableCell>
                <span className="font-mono text-sm">{statement.statementNumber}</span>
              </TableCell>
              <TableCell>{statement.client.name}</TableCell>
              <TableCell>
                <Badge variant="outline">{typeLabel(statement.type)}</Badge>
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(statement.periodStart)} – {formatDate(statement.periodEnd)}
              </TableCell>
              <TableCell className="text-sm">{formatDate(statement.generatedAt)}</TableCell>
              <TableCell>
                <Badge variant={emailStatusVariant(statement.emailStatus)}>
                  {statement.emailStatus.charAt(0) + statement.emailStatus.slice(1).toLowerCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="View PDF"
                    render={
                      <a
                        href={`/api/pdf/${statement.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Download PDF"
                    render={
                      <a
                        href={`/api/pdf/${statement.id}`}
                        download={`${statement.statementNumber}.pdf`}
                      />
                    }
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Send Email"
                    disabled={sending === statement.id}
                    onClick={() => handleSend(statement.id)}
                  >
                    <MailIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
