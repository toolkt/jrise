"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
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
import { Switch } from "@/components/ui/switch";
import { clientSettingsSchema, type ClientSettingsInput } from "@/lib/validations/client";
import { updateClientSettings } from "../actions";

type ClientSettingsFormProps = {
  clientId: string;
  settings: {
    rebateEnabled: boolean;
    rebatePercentage: number;
    withholdingTaxEnabled: boolean;
    withholdingTaxRate: number;
    disclaimerType: string;
    customDisclaimerText: string | null;
    interestRepaidType: string;
    cashFlowMode: string;
  };
};

export function ClientSettingsForm({ clientId, settings }: ClientSettingsFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ClientSettingsInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(clientSettingsSchema) as any,
    defaultValues: {
      rebateEnabled: settings.rebateEnabled,
      rebatePercentage: settings.rebatePercentage,
      withholdingTaxEnabled: settings.withholdingTaxEnabled,
      withholdingTaxRate: settings.withholdingTaxRate,
      disclaimerType: settings.disclaimerType as "STD" | "FI" | "CUSTOM",
      customDisclaimerText: settings.customDisclaimerText ?? "",
      interestRepaidType: settings.interestRepaidType as "NORMAL" | "ACCRUED",
      cashFlowMode: settings.cashFlowMode as "WITH" | "WITHOUT",
    },
  });

  const rebateEnabled = watch("rebateEnabled");
  const withholdingTaxEnabled = watch("withholdingTaxEnabled");
  const disclaimerType = watch("disclaimerType");

  async function onSubmit(data: ClientSettingsInput) {
    try {
      await updateClientSettings(clientId, data);
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Disclaimer Type */}
      <div className="space-y-1">
        <Label>Disclaimer Type</Label>
        <Select
          value={watch("disclaimerType")}
          onValueChange={(v) => v && setValue("disclaimerType", v as "STD" | "FI" | "CUSTOM")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select disclaimer type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STD">STD</SelectItem>
            <SelectItem value="FI">FI</SelectItem>
            <SelectItem value="CUSTOM">Custom</SelectItem>
          </SelectContent>
        </Select>
        {errors.disclaimerType && (
          <p className="text-sm text-destructive">{errors.disclaimerType.message}</p>
        )}
      </div>

      {/* Custom Disclaimer Text (shown only when disclaimerType === "CUSTOM") */}
      {disclaimerType === "CUSTOM" && (
        <div className="space-y-1">
          <Label htmlFor="customDisclaimerText">Custom Disclaimer Text</Label>
          <textarea
            id="customDisclaimerText"
            {...register("customDisclaimerText")}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Enter custom disclaimer text..."
          />
          {errors.customDisclaimerText && (
            <p className="text-sm text-destructive">{errors.customDisclaimerText.message}</p>
          )}
        </div>
      )}

      {/* Interest Repaid Type */}
      <div className="space-y-1">
        <Label>Interest Repaid Type</Label>
        <Select
          value={watch("interestRepaidType")}
          onValueChange={(v) => v && setValue("interestRepaidType", v as "NORMAL" | "ACCRUED")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select interest repaid type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NORMAL">Normal — Interest Repaid</SelectItem>
            <SelectItem value="ACCRUED">FI — Net Interest Repaid</SelectItem>
          </SelectContent>
        </Select>
        {errors.interestRepaidType && (
          <p className="text-sm text-destructive">{errors.interestRepaidType.message}</p>
        )}
      </div>

      {/* Cash Flow Mode */}
      <div className="space-y-1">
        <Label>Cash Flow Mode</Label>
        <Select
          value={watch("cashFlowMode")}
          onValueChange={(v) => v && setValue("cashFlowMode", v as "WITH" | "WITHOUT")}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select cash flow mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="WITH">With Cash Flow</SelectItem>
            <SelectItem value="WITHOUT">Without Cash Flow</SelectItem>
          </SelectContent>
        </Select>
        {errors.cashFlowMode && (
          <p className="text-sm text-destructive">{errors.cashFlowMode.message}</p>
        )}
      </div>

      {/* Rebate */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={rebateEnabled}
            onCheckedChange={(checked) => setValue("rebateEnabled", checked)}
          />
          <Label>Rebate Enabled</Label>
        </div>
        {rebateEnabled && (
          <div className="space-y-1">
            <Label htmlFor="rebatePercentage">Rebate Percentage (0–1)</Label>
            <Input
              id="rebatePercentage"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              {...register("rebatePercentage", { valueAsNumber: true })}
              placeholder="e.g. 0.05 for 5%"
            />
            {errors.rebatePercentage && (
              <p className="text-sm text-destructive">{errors.rebatePercentage.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Withholding Tax */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={withholdingTaxEnabled}
            onCheckedChange={(checked) => setValue("withholdingTaxEnabled", checked)}
          />
          <Label>Withholding Tax Enabled</Label>
        </div>
        {withholdingTaxEnabled && (
          <div className="space-y-1">
            <Label htmlFor="withholdingTaxRate">Withholding Tax Rate (0–1)</Label>
            <Input
              id="withholdingTaxRate"
              type="number"
              step="0.0001"
              min="0"
              max="1"
              {...register("withholdingTaxRate", { valueAsNumber: true })}
              placeholder="e.g. 0.15 for 15%"
            />
            {errors.withholdingTaxRate && (
              <p className="text-sm text-destructive">{errors.withholdingTaxRate.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
