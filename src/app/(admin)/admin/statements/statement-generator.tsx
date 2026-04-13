"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateStatement } from "./actions";
import type { StatementType } from "@/generated/prisma/client";

interface Client {
  id: string;
  name: string;
  clientCode: string;
}

interface StatementGeneratorProps {
  clients: Client[];
}

export function StatementGenerator({ clients }: StatementGeneratorProps) {
  const [clientId, setClientId] = useState("");
  const [type, setType] = useState<StatementType>("MONTHLY");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId || !periodStart || !periodEnd) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await generateStatement({
        clientId,
        type,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        quarter: type === "QUARTERLY" ? getQuarter(new Date(periodEnd)) : undefined,
      });
      toast.success("Statement generated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate statement.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function getQuarter(date: Date): number {
    const month = date.getMonth() + 1;
    return Math.ceil(month / 3);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Statement</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="client">Client</Label>
              <Select value={clientId} onValueChange={(value) => value && setClientId(value)}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as StatementType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUAL">Annual</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start</Label>
              <Input
                id="periodStart"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End</Label>
              <Input
                id="periodEnd"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Generate"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
