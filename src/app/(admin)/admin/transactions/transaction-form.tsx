"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { createTransactionSchema, type CreateTransactionInput } from "@/lib/validations/transaction";
import { createTransaction } from "./actions";

interface TransactionFormDialogProps {
  clients: { id: string; name: string; clientCode: string }[];
}

export function TransactionFormDialog({ clients }: TransactionFormDialogProps) {
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransactionInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createTransactionSchema) as any,
    defaultValues: {
      description: "",
      notes: "",
    },
  });

  const clientId = watch("clientId") ?? "";
  const type = watch("type");

  async function onSubmit(data: CreateTransactionInput) {
    try {
      await createTransaction(data);
      toast.success("Transaction created successfully");
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button>
            <PlusIcon className="h-4 w-4 mr-1" />
            Add Transaction
          </Button>
        }
      />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="clientId">Client</Label>
            <Select
              value={clientId}
              onValueChange={(value) => value && setValue("clientId", value)}
            >
              <SelectTrigger id="clientId">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} ({client.clientCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.clientId && (
              <p className="text-sm text-destructive">{errors.clientId.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setValue("type", value as CreateTransactionInput["type"])
              }
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DEPOSIT">Deposit</SelectItem>
                <SelectItem value="WITHDRAWAL">Withdrawal</SelectItem>
                <SelectItem value="INTEREST_REPAID">Interest Repaid</SelectItem>
                <SelectItem value="CAPITAL_REDUCTION">Capital Reduction</SelectItem>
                <SelectItem value="REBATE">Rebate</SelectItem>
                <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-sm text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                {...register("amount", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.amount && (
                <p className="text-sm text-destructive">{errors.amount.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                {...register("effectiveDate")}
              />
              {errors.effectiveDate && (
                <p className="text-sm text-destructive">{errors.effectiveDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              {...register("description")}
              placeholder="Optional description"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes">Notes (internal)</Label>
            <Input
              id="notes"
              {...register("notes")}
              placeholder="Internal notes"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
