"use client";

import { useState } from "react";
import { Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
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
import type { getTransactions } from "./actions";
import { deleteTransaction } from "./actions";
import { TransactionFormDialog } from "./transaction-form";

type TransactionWithClient = Awaited<ReturnType<typeof getTransactions>>[number];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatCurrency(value: string | number | { toString(): string }) {
  const num = typeof value === "number" ? value : parseFloat(value.toString());
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function typeLabel(type: string) {
  switch (type) {
    case "DEPOSIT": return "Deposit";
    case "WITHDRAWAL": return "Withdrawal";
    case "INTEREST_REPAID": return "Interest Repaid";
    case "CAPITAL_REDUCTION": return "Capital Reduction";
    case "REBATE": return "Rebate";
    case "MISCELLANEOUS": return "Miscellaneous";
    default: return type;
  }
}

function typeBadgeVariant(type: string): "default" | "destructive" | "secondary" {
  switch (type) {
    case "DEPOSIT": return "default";
    case "WITHDRAWAL":
    case "INTEREST_REPAID":
    case "CAPITAL_REDUCTION": return "destructive";
    case "REBATE":
    case "MISCELLANEOUS": return "secondary";
    default: return "secondary";
  }
}

export function TransactionTable({
  transactions,
  clients,
}: {
  transactions: TransactionWithClient[];
  clients: { id: string; name: string; clientCode: string }[];
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    setDeleting(id);
    try {
      await deleteTransaction(id);
      toast.success("Transaction deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No transactions found. Add a transaction to get started.
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">
                  {formatDate(t.effectiveDate)}
                </TableCell>
                <TableCell>{t.client.name}</TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant(t.type)}>
                    {typeLabel(t.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(t.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {t.description || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <TransactionFormDialog
                      clients={clients}
                      transaction={{
                        id: t.id,
                        clientId: t.clientId,
                        type: t.type,
                        amount: Number(t.amount),
                        effectiveDate: t.effectiveDate,
                        description: t.description,
                        notes: t.notes,
                      }}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={deleting === t.id}
                      onClick={() => handleDelete(t.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
