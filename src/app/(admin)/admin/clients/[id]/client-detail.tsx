"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientFormDialog } from "../client-form";
import { PortalAccess } from "./portal-access";
import type { getClient } from "../actions";

type Client = NonNullable<Awaited<ReturnType<typeof getClient>>> & {
  user: { id: string; email: string; isActive: boolean } | null;
};

function formatCurrency(value: string | number | { toString(): string }) {
  const num = typeof value === "number" ? value : parseFloat(value.toString());
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface ClientDetailProps {
  client: Client;
}

export function ClientDetail({ client }: ClientDetailProps) {
  const lastRecord = client.clientMonthlyRecords[0];
  const currentBalance = lastRecord
    ? formatCurrency(lastRecord.closingBalance)
    : formatCurrency(client.openingPrincipal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-muted-foreground font-mono text-sm mt-1">
            {client.clientCode}
          </p>
        </div>
        <ClientFormDialog client={client} />
      </div>

      {/* Portal Access */}
      <PortalAccess
        clientId={client.id}
        clientEmail={client.email}
        portalUser={client.user ? { id: client.user.id, email: client.user.email, isActive: client.user.isActive } : null}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{currentBalance}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opening Principal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">
              {formatCurrency(client.openingPrincipal)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Start Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDate(client.startDate)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="monthly-records">
        <TabsList>
          <TabsTrigger value="monthly-records">Monthly Records</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
        </TabsList>

        {/* Monthly Records Tab */}
        <TabsContent value="monthly-records">
          <div className="rounded-md border mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Opening</TableHead>
                  <TableHead className="text-right">Interest</TableHead>
                  <TableHead className="text-right">Closing</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.clientMonthlyRecords.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-6"
                    >
                      No monthly records yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  client.clientMonthlyRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.month)}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(record.openingBalance)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-600 dark:text-green-400">
                        {formatCurrency(record.interestEarned)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(record.closingBalance)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {(parseFloat(record.interestRateApplied.toString()) * 100).toFixed(4)}%
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {(parseFloat(record.percentageShare.toString()) * 100).toFixed(4)}%
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions">
          <div className="rounded-md border mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.fundTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-6"
                    >
                      No transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  client.fundTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{formatDate(tx.effectiveDate)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {tx.type.replace(/_/g, " ").toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(tx.amount)}
                      </TableCell>
                      <TableCell className="text-sm">{tx.description}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Statements Tab */}
        <TabsContent value="statements">
          <div className="rounded-md border mt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Statement No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Email Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {client.statements.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-6"
                    >
                      No statements yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  client.statements.map((stmt) => (
                    <TableRow key={stmt.id}>
                      <TableCell>
                        <span className="font-mono text-sm">{stmt.statementNumber}</span>
                      </TableCell>
                      <TableCell className="capitalize">
                        {stmt.type.toLowerCase()}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(stmt.periodStart)} – {formatDate(stmt.periodEnd)}
                      </TableCell>
                      <TableCell>{formatDate(stmt.generatedAt)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            stmt.emailStatus === "SENT"
                              ? "default"
                              : stmt.emailStatus === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {stmt.emailStatus.toLowerCase()}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Contact Info Tab */}
        <TabsContent value="contact">
          <Card className="mt-2">
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="mt-1">{client.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                  <p className="mt-1">{client.mobile || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <div className="mt-1 space-y-0.5">
                  <p>{client.addressLine1}</p>
                  {client.addressLine2 && <p>{client.addressLine2}</p>}
                  {client.addressLine3 && <p>{client.addressLine3}</p>}
                  {client.addressLine4 && <p>{client.addressLine4}</p>}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Statement Frequency
                </p>
                <div className="mt-1">
                  <Badge variant="outline">
                    {client.statementFrequency === "MONTHLY" ? "Monthly" : "Quarterly"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
