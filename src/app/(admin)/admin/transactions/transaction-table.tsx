"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
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

type Transaction = Awaited<ReturnType<typeof getTransactions>>[number];

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

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
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
            <TableHead className="w-[60px]"></TableHead>
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
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-sm">
                  {formatDate(tx.effectiveDate)}
                </TableCell>
                <TableCell>{tx.client.name}</TableCell>
                <TableCell>
                  <Badge variant={typeBadgeVariant(tx.type)}>
                    {typeLabel(tx.type)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {formatCurrency(tx.amount)}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {tx.description || "—"}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleting === tx.id}
                    onClick={() => handleDelete(tx.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
