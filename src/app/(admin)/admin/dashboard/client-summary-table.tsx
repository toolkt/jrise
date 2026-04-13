import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ClientSummary } from "./actions";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type ClientSummaryTableProps = {
  clients: ClientSummary[];
};

export function ClientSummaryTable({ clients }: ClientSummaryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Client Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Current</TableHead>
              <TableHead className="text-right">YTD Return</TableHead>
              <TableHead className="text-right">YTD Interest</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                  No active clients found.
                </TableCell>
              </TableRow>
            ) : (
              clients.map((client) => (
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
                    <span className="font-mono text-sm text-muted-foreground">
                      {client.clientCode}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(client.openingPrincipal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(client.currentBalance)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-green-600 font-medium">
                      {client.ytdReturn.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(client.totalInterest)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
