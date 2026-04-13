"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { getClients } from "./actions";

type Client = Awaited<ReturnType<typeof getClients>>[number];

function formatCurrency(value: string | number | { toString(): string }) {
  const num = typeof value === "number" ? value : parseFloat(value.toString());
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

interface ClientTableProps {
  clients: Client[];
}

export function ClientTable({ clients }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Opening Principal</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No clients found. Add a client to get started.
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
            <TableHead>Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="text-right">Opening Principal</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id}>
              <TableCell>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="font-medium hover:underline"
                >
                  {client.name}
                </Link>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{client.clientCode}</span>
              </TableCell>
              <TableCell>{client.email}</TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatCurrency(client.openingPrincipal)}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {client.statementFrequency === "MONTHLY" ? "Monthly" : "Quarterly"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={client.isActive ? "default" : "secondary"}>
                  {client.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
