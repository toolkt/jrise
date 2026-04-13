"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateMonthlyRecords, type CalculatedRecord } from "@/lib/calculations";
import { getMonthPreview, processMonth } from "./actions";
import type { FiscalYear, MonthlyInterestRate } from "@/generated/prisma/client";

interface ProcessingWizardProps {
  fiscalYear: FiscalYear;
  rates: MonthlyInterestRate[];
}

type MonthPreview = Awaited<ReturnType<typeof getMonthPreview>>;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function typeLabel(type: string): string {
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
    default: return "secondary";
  }
}

function generateMonthOptions(fiscalYear: FiscalYear) {
  const months: { value: string; label: string; date: Date }[] = [];
  const start = new Date(fiscalYear.startDate);
  // Normalise to first of month in UTC
  const baseDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));

  for (let i = 0; i < 12; i++) {
    const d = new Date(baseDate);
    d.setUTCMonth(d.getUTCMonth() + i);
    const value = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = new Intl.DateTimeFormat("en-AU", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
    months.push({ value, label, date: d });
  }
  return months;
}

export function ProcessingWizard({ fiscalYear, rates }: ProcessingWizardProps) {
  const router = useRouter();
  const monthOptions = generateMonthOptions(fiscalYear);
  const lockedMonths = new Set(
    rates.filter((r) => r.isLocked).map((r) => new Date(r.month).toISOString().slice(0, 10))
  );

  const firstUnlocked = monthOptions.find((m) => !lockedMonths.has(m.value));

  const [step, setStep] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(firstUnlocked?.value ?? monthOptions[0]?.value ?? "");
  const [interestRate, setInterestRate] = useState("");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<MonthPreview | null>(null);
  const [calculatedRecords, setCalculatedRecords] = useState<CalculatedRecord[]>([]);
  const [processing, setProcessing] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadPreview = useCallback(async (monthValue: string, rate: string) => {
    if (!monthValue) return;
    setLoadingPreview(true);
    try {
      const monthDate = new Date(monthValue + "T00:00:00.000Z");
      const data = await getMonthPreview(monthDate);
      setPreview(data);

      const rateNum = parseFloat(rate);
      if (!isNaN(rateNum) && rateNum > 0) {
        const records = calculateMonthlyRecords(
          data.previousBalances,
          rateNum / 100,
          data.transactions
        );
        setCalculatedRecords(records);
      } else {
        setCalculatedRecords([]);
      }
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setLoadingPreview(false);
    }
  }, []);

  useEffect(() => {
    loadPreview(selectedMonth, interestRate);
  }, [selectedMonth, interestRate, loadPreview]);

  async function handleProcess() {
    if (!selectedMonth) return;
    setProcessing(true);
    try {
      const monthDate = new Date(selectedMonth + "T00:00:00.000Z");
      await processMonth(monthDate, parseFloat(interestRate), notes);
      toast.success("Month processed and locked successfully");
      router.refresh();
      // Reset form
      setStep(1);
      setInterestRate("");
      setNotes("");
      setPreview(null);
      setCalculatedRecords([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  }

  const selectedMonthOption = monthOptions.find((m) => m.value === selectedMonth);
  const rateNum = parseFloat(interestRate);
  const isRateValid = !isNaN(rateNum) && rateNum > 0;
  const isMonthLocked = lockedMonths.has(selectedMonth);

  const totalPrevious = preview?.previousBalances.reduce((sum, b) => sum + b.balance, 0) ?? 0;
  const totalInterest = calculatedRecords.reduce((sum, r) => sum + r.interestEarned, 0);
  const totalClosing = calculatedRecords.reduce((sum, r) => sum + r.closingBalance, 0);

  return (
    <div className="space-y-6">
      {/* Processing History */}
      <Card>
        <CardHeader>
          <CardTitle>Processing History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {monthOptions.map((mo) => {
              const isLocked = lockedMonths.has(mo.value);
              return (
                <Badge
                  key={mo.value}
                  variant={isLocked ? "default" : "outline"}
                >
                  {mo.label}
                </Badge>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                s === step
                  ? "bg-primary text-primary-foreground"
                  : s < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s}
            </div>
            <span className={`text-sm ${s === step ? "font-medium" : "text-muted-foreground"}`}>
              {s === 1 && "Enter Rate"}
              {s === 2 && "Review Transactions"}
              {s === 3 && "Preview Calculations"}
              {s === 4 && "Confirm & Lock"}
            </span>
            {s < 4 && <span className="text-muted-foreground mx-1">›</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Enter Rate */}
      {step === 1 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Enter Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="month-select">Month</Label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {monthOptions.map((mo) => (
                    <option key={mo.value} value={mo.value} disabled={lockedMonths.has(mo.value)}>
                      {mo.label}{lockedMonths.has(mo.value) ? " (Locked)" : ""}
                    </option>
                  ))}
                </select>
                {isMonthLocked && (
                  <p className="text-xs text-destructive">This month is already locked.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                <Input
                  id="interest-rate"
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="e.g. 0.750"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  type="text"
                  placeholder="Any notes about this processing run"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Button
                className="w-full"
                disabled={!isRateValid || isMonthLocked || loadingPreview}
                onClick={() => setStep(2)}
              >
                Continue to Review
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preview Impact</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPreview ? (
                  <p className="text-sm text-muted-foreground">Loading preview…</p>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total fund (previous)</span>
                      <span className="font-mono">{formatCurrency(totalPrevious)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total interest</span>
                      <span className="font-mono text-green-600">{formatCurrency(totalInterest)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 font-medium">
                      <span>New fund total</span>
                      <span className="font-mono">{formatCurrency(totalClosing)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Per-Client Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPreview ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : preview && calculatedRecords.length > 0 ? (
                  <div className="space-y-2">
                    {preview.clients.map((client) => {
                      const rec = calculatedRecords.find((r) => r.clientId === client.id);
                      return (
                        <div key={client.id} className="flex items-center justify-between text-sm">
                          <span className="truncate text-muted-foreground">{client.name}</span>
                          <span className="font-mono text-green-600 ml-4">
                            +{formatCurrency(rec?.interestEarned ?? 0)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter a rate to see client breakdown.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Review Transactions */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Review Transactions — {selectedMonthOption?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!preview || preview.rawTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No transactions for this month.
                      </TableCell>
                    </TableRow>
                  ) : (
                    preview.rawTransactions.map((tx) => (
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
                          {formatCurrency(Number(tx.amount))}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {tx.description || "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Continue to Preview</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview Calculations */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Calculations — {selectedMonthOption?.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Opening</TableHead>
                    <TableHead className="text-right">Interest</TableHead>
                    <TableHead className="text-right">Closing</TableHead>
                    <TableHead className="text-right">Share (%)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calculatedRecords.map((rec) => {
                    const client = preview?.clients.find((c) => c.id === rec.clientId);
                    return (
                      <TableRow key={rec.clientId}>
                        <TableCell>{client?.name ?? rec.clientId}</TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {formatCurrency(rec.openingBalance)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm text-green-600">
                          {formatCurrency(rec.interestEarned)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm font-bold">
                          {formatCurrency(rec.closingBalance)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {(rec.percentageShare * 100).toFixed(2)}%
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {calculatedRecords.length > 0 && (
                    <TableRow className="bg-muted/50 font-medium">
                      <TableCell>Total</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(totalPrevious)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-green-600">
                        {formatCurrency(totalInterest)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-bold">
                        {formatCurrency(totalClosing)}
                      </TableCell>
                      <TableCell className="text-right text-sm">100.00%</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Continue to Confirm</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Confirm & Lock */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm & Lock — {selectedMonthOption?.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-medium mb-1">Warning: This action cannot be undone</p>
              <p>
                Processing will lock this month and generate final monthly records for all clients.
                Once locked, the interest rate and client balances cannot be modified.
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Month</span>
                <span className="font-medium">{selectedMonthOption?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate</span>
                <span className="font-medium font-mono">{interestRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Interest</span>
                <span className="font-medium font-mono text-green-600">{formatCurrency(totalInterest)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-medium">New Fund Total</span>
                <span className="font-bold font-mono">{formatCurrency(totalClosing)}</span>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} disabled={processing}>
                Back
              </Button>
              <Button
                onClick={handleProcess}
                disabled={processing}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {processing ? "Processing…" : "Confirm & Lock Month"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
