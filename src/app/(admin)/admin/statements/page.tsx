import { getStatements } from "./actions";
import { getClients } from "@/app/(admin)/admin/clients/actions";
import { StatementGenerator } from "./statement-generator";
import { StatementTable } from "./statement-table";

export default async function StatementsPage() {
  const [statements, clients] = await Promise.all([
    getStatements(),
    getClients(),
  ]);

  const activeClients = clients.filter((c) => c.isActive);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Statements</h1>
        <p className="text-muted-foreground text-sm">
          Generate and send client investment statements
        </p>
      </div>
      <div className="space-y-6">
        <StatementGenerator clients={activeClients} />
        <StatementTable statements={statements} />
      </div>
    </div>
  );
}
