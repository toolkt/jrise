"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PlusIcon, PencilIcon } from "lucide-react";
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
import { createClientSchema, type CreateClientInput } from "@/lib/validations/client";
import { createClient, updateClient } from "./actions";

interface ClientFormDialogProps {
  client?: {
    id: string;
    clientCode: string;
    name: string;
    addressLine1: string;
    addressLine2?: string | null;
    addressLine3?: string | null;
    addressLine4?: string | null;
    email: string;
    mobile?: string | null;
    statementFrequency: "MONTHLY" | "QUARTERLY";
    openingPrincipal: { toString(): string };
    startDate: Date;
  };
}

export function ClientFormDialog({ client }: ClientFormDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = !!client;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createClientSchema) as any,
    defaultValues: client
      ? {
          clientCode: client.clientCode,
          name: client.name,
          addressLine1: client.addressLine1,
          addressLine2: client.addressLine2 ?? "",
          addressLine3: client.addressLine3 ?? "",
          addressLine4: client.addressLine4 ?? "",
          email: client.email,
          mobile: client.mobile ?? "",
          statementFrequency: client.statementFrequency,
          openingPrincipal: parseFloat(client.openingPrincipal.toString()),
          startDate: new Date(client.startDate),
        }
      : {
          addressLine2: "",
          addressLine3: "",
          addressLine4: "",
          mobile: "",
        },
  });

  const statementFrequency = watch("statementFrequency");

  async function onSubmit(data: CreateClientInput) {
    try {
      if (isEdit) {
        await updateClient(client.id, data);
        toast.success("Client updated successfully");
      } else {
        await createClient(data);
        toast.success("Client created successfully");
        reset();
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="outline" size="sm">
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </Button>
          ) : (
            <Button>
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Client
            </Button>
          )
        }
      />
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Client" : "Add Client"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="clientCode">Client Code</Label>
              <Input
                id="clientCode"
                {...register("clientCode")}
                placeholder="e.g. JR001"
              />
              {errors.clientCode && (
                <p className="text-sm text-destructive">{errors.clientCode.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Client name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="addressLine1">Address Line 1</Label>
            <Input
              id="addressLine1"
              {...register("addressLine1")}
              placeholder="Street address"
            />
            {errors.addressLine1 && (
              <p className="text-sm text-destructive">{errors.addressLine1.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="addressLine2">Address Line 2</Label>
            <Input
              id="addressLine2"
              {...register("addressLine2")}
              placeholder="Suburb"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="addressLine3">Address Line 3</Label>
              <Input
                id="addressLine3"
                {...register("addressLine3")}
                placeholder="State"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="addressLine4">Address Line 4</Label>
              <Input
                id="addressLine4"
                {...register("addressLine4")}
                placeholder="Postcode"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="email@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="mobile">Mobile</Label>
              <Input
                id="mobile"
                {...register("mobile")}
                placeholder="+61 4XX XXX XXX"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="openingPrincipal">Opening Principal</Label>
              <Input
                id="openingPrincipal"
                type="number"
                step="0.01"
                {...register("openingPrincipal", { valueAsNumber: true })}
                placeholder="0.00"
              />
              {errors.openingPrincipal && (
                <p className="text-sm text-destructive">{errors.openingPrincipal.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
              {errors.startDate && (
                <p className="text-sm text-destructive">{errors.startDate.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="statementFrequency">Statement Frequency</Label>
            <Select
              value={statementFrequency}
              onValueChange={(value) =>
                setValue("statementFrequency", value as "MONTHLY" | "QUARTERLY")
              }
            >
              <SelectTrigger id="statementFrequency">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
              </SelectContent>
            </Select>
            {errors.statementFrequency && (
              <p className="text-sm text-destructive">{errors.statementFrequency.message}</p>
            )}
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
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Client"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
