import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { getTransactions } from "./actions";
import { TransactionTable } from "./transaction-table";
import { TransactionFormDialog } from "./transaction-form";
import { Button } from "@/components/ui/button";

export default async function TransactionsPage() {
  const [rawTransactions, clients] = await Promise.all([
    getTransactions(),
    db.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true, clientCode: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const transactions = rawTransactions.map((t) => ({
    ...t,
    amount: Number(t.amount),
    client: { ...t.client, openingPrincipal: Number(t.client.openingPrincipal) },
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Manage fund transactions for all clients
          </p>
        </div>
        <TransactionFormDialog
          clients={clients}
          trigger={<Button><Plus className="h-4 w-4 mr-2" /> Add Transaction</Button>}
        />
      </div>
      <TransactionTable transactions={transactions as any} clients={clients} />
    </div>
  );
}
