import { notFound } from "next/navigation";
import { getClient } from "../actions";
import { ClientDetail } from "./client-detail";

interface ClientPageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientPage({ params }: ClientPageProps) {
  const { id } = await params;
  const rawClient = await getClient(id);

  if (!rawClient) {
    notFound();
  }

  // Serialize Decimal fields to plain numbers for client component
  const client = {
    ...rawClient,
    openingPrincipal: Number(rawClient.openingPrincipal),
    clientSettings: rawClient.clientSettings ? {
      ...rawClient.clientSettings,
      rebatePercentage: Number(rawClient.clientSettings.rebatePercentage),
      withholdingTaxRate: Number(rawClient.clientSettings.withholdingTaxRate),
    } : null,
    clientMonthlyRecords: rawClient.clientMonthlyRecords.map((r) => ({
      ...r,
      openingBalance: Number(r.openingBalance),
      closingBalance: Number(r.closingBalance),
      interestEarned: Number(r.interestEarned),
      interestRateApplied: Number(r.interestRateApplied),
      percentageShare: Number(r.percentageShare),
    })),
    fundTransactions: rawClient.fundTransactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    })),
    statements: rawClient.statements.map((s) => ({
      ...s,
      closingBalance: Number(s.closingBalance),
    })),
  };

  return <ClientDetail client={client as any} />;
}
