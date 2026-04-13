import { notFound } from "next/navigation";
import { getClient } from "../actions";
import { ClientDetail } from "./client-detail";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const client = await getClient(id);

  if (!client) {
    notFound();
  }

  return <ClientDetail client={client} />;
}
