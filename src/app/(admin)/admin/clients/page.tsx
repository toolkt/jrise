import { getClients } from "./actions";
import { ClientTable } from "./client-table";
import { ClientFormDialog } from "./client-form";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Clients</h1>
          <p className="text-muted-foreground text-sm">
            Manage client accounts and settings
          </p>
        </div>
        <ClientFormDialog />
      </div>
      <ClientTable clients={clients} />
    </div>
  );
}
