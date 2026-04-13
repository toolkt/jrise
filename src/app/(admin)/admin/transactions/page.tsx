import { db } from "@/lib/db";
import { getTransactions } from "./actions";
import { TransactionTable } from "./transaction-table";
import { TransactionFormDialog } from "./transaction-form";

export default async function TransactionsPage() {
  const [transactions, clients] = await Promise.all([
    getTransactions(),
    db.client.findMany({
      where: { isActive: true },
      select: { id: true, name: true, clientCode: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Transactions</h1>
          <p className="text-muted-foreground text-sm">
            Manage fund transactions for all clients
          </p>
        </div>
        <TransactionFormDialog clients={clients} />
      </div>
      <TransactionTable transactions={transactions} />
    </div>
  );
}
