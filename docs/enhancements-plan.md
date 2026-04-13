# JRISE Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add portal access management, transaction editing, and comprehensive master data management to the JRISE Investment Management System.

**Architecture:** Enhance existing server actions and UI components. Add one new database table (`company_settings`), one new enum (`CashFlowMode`), extend `DisclaimerType` enum with `FI` value, and add `cash_flow_mode` column to `client_settings`. All changes follow established patterns (server actions + "use client" components + shadcn/ui + base-ui Dialog render prop).

**Tech Stack:** Next.js 16, TypeScript, Prisma v7, PostgreSQL, shadcn/ui, react-hook-form, Zod, bcryptjs

**Spec:** `docs/enhancements-design.md`

---

## Task 1: Database Schema Changes

**Files:**
- Modify: `prisma/schema.prisma`
- Create: new Prisma migration

- [ ] **Step 1: Add CashFlowMode enum and update DisclaimerType enum**

In `prisma/schema.prisma`, add the new enum after the existing enums:

```prisma
enum CashFlowMode {
  WITH
  WITHOUT
}
```

Update `DisclaimerType` to include FI:

```prisma
enum DisclaimerType {
  STD
  FI
  CUSTOM
}
```

- [ ] **Step 2: Add cash_flow_mode to ClientSettings model**

In the `ClientSettings` model, add after `interestRepaidType`:

```prisma
cashFlowMode CashFlowMode @default(WITHOUT) @map("cash_flow_mode")
```

- [ ] **Step 3: Add CompanySettings model**

Add after the `FiscalYear` model:

```prisma
model CompanySettings {
  id               String   @id @default(uuid())
  companyName      String   @default("JRISE Smart Trading Pty Limited") @map("company_name")
  acn              String   @default("627 266 337")
  addressLine1     String   @default("PO Box 4399 North Rocks NSW 2151") @map("address_line1")
  addressLine2     String?  @map("address_line2")
  email            String   @default("jerrold@jrise.com.au")
  phone            String?
  stdDisclaimerText String  @default("Your statement does NOT incorporate any applicable taxes. We strongly recommend seeking guidance from a certified accountant or financial advisor to assess any potential tax liability or obligations you may incur.") @map("std_disclaimer_text")
  fiDisclaimerText  String  @default("Your statement includes a 10% Foreign Investor Withholding Tax. JRISE Smart Trading Pty Ltd will pay this amount to the Australian Taxation Office (ATO) on your behalf. However, we still strongly recommend seeking guidance from a certified accountant or financial advisor to assess any further potential tax liabilities or obligations you may incur.") @map("fi_disclaimer_text")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@map("company_settings")
}
```

- [ ] **Step 4: Run the migration**

```bash
cd /Volumes/Workspace/Development/CHAY/jrise
npx prisma migrate dev --name add-company-settings-and-enhancements
```

- [ ] **Step 5: Seed default company settings**

Add to `prisma/seed.ts`, after the fiscal year upsert:

```typescript
await prisma.companySettings.upsert({
  where: { id: "default" },
  update: {},
  create: {
    id: "default",
  },
});
console.log("✓ Default company settings created");
```

Run seed:
```bash
npx prisma db seed
```

- [ ] **Step 6: Commit**

```bash
git add prisma/
git commit -m "feat: add company_settings table, CashFlowMode enum, FI disclaimer type"
```

---

## Task 2: Portal Access — Server Actions

**Files:**
- Modify: `src/app/(admin)/admin/clients/actions.ts`

- [ ] **Step 1: Add portal access server actions**

Add these imports at the top of `src/app/(admin)/admin/clients/actions.ts`:

```typescript
import bcrypt from "bcryptjs";
```

Add these three new exported functions:

```typescript
export async function enablePortalAccess(
  clientId: string,
  email: string,
  password: string
) {
  await requireAdmin();

  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });
  if (client.userId) throw new Error("Portal access already enabled");

  const nameParts = client.name.split(" ");
  const firstName = nameParts[0] ?? "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      role: "CLIENT",
      firstName,
      lastName,
    },
  });

  await db.client.update({
    where: { id: clientId },
    data: { userId: user.id },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function resetPortalPassword(
  clientId: string,
  newPassword: string
) {
  await requireAdmin();

  const client = await db.client.findUniqueOrThrow({
    where: { id: clientId },
    include: { user: true },
  });
  if (!client.userId || !client.user) throw new Error("No portal access");

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await db.user.update({
    where: { id: client.userId },
    data: { passwordHash },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function disablePortalAccess(clientId: string) {
  await requireAdmin();

  const client = await db.client.findUniqueOrThrow({ where: { id: clientId } });
  if (!client.userId) throw new Error("No portal access");

  await db.user.update({
    where: { id: client.userId },
    data: { isActive: false },
  });

  await db.client.update({
    where: { id: clientId },
    data: { userId: null },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}
```

- [ ] **Step 2: Update getClient to include user relation**

In the existing `getClient` function, add `user: true` to the include:

```typescript
export async function getClient(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      user: true,
      clientSettings: true,
      clientMonthlyRecords: { orderBy: { month: "desc" } },
      fundTransactions: { orderBy: { effectiveDate: "desc" } },
      statements: { orderBy: { generatedAt: "desc" } },
    },
  });
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/clients/actions.ts
git commit -m "feat: add portal access server actions (enable, reset password, disable)"
```

---

## Task 3: Portal Access — UI Components

**Files:**
- Create: `src/app/(admin)/admin/clients/[id]/portal-access.tsx`
- Modify: `src/app/(admin)/admin/clients/[id]/client-detail.tsx`

- [ ] **Step 1: Create portal access component**

Create `src/app/(admin)/admin/clients/[id]/portal-access.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { enablePortalAccess, resetPortalPassword, disablePortalAccess } from "../actions";
import { Shield, KeyRound, ShieldOff } from "lucide-react";

function generatePassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

type PortalAccessProps = {
  clientId: string;
  clientEmail: string;
  portalUser: { id: string; email: string; isActive: boolean } | null;
};

export function PortalAccess({ clientId, clientEmail, portalUser }: PortalAccessProps) {
  const router = useRouter();
  const [enableOpen, setEnableOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [email, setEmail] = useState(clientEmail);
  const [password, setPassword] = useState(generatePassword());
  const [loading, setLoading] = useState(false);

  async function handleEnable() {
    setLoading(true);
    try {
      await enablePortalAccess(clientId, email, password);
      toast.success("Portal access enabled");
      setEnableOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to enable portal access");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setLoading(true);
    try {
      await resetPortalPassword(clientId, password);
      toast.success("Password reset successfully");
      setResetOpen(false);
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisable() {
    if (!confirm("Disable portal access for this client? They will no longer be able to log in.")) return;
    try {
      await disablePortalAccess(clientId);
      toast.success("Portal access disabled");
      router.refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to disable portal access");
    }
  }

  if (portalUser) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Portal Access</CardTitle>
            <Badge variant="default" className="bg-green-600">Active</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm">
            <span className="text-muted-foreground">Login email:</span>{" "}
            <span className="font-mono">{portalUser.email}</span>
          </div>
          <div className="flex gap-2">
            <Dialog open={resetOpen} onOpenChange={(open) => { setResetOpen(open); if (open) setPassword(generatePassword()); }}>
              <DialogTrigger render={<Button variant="outline" size="sm"><KeyRound className="h-3 w-3 mr-1" /> Reset Password</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Portal Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setResetOpen(false)}>Cancel</Button>
                    <Button onClick={handleResetPassword} disabled={loading || !password}>
                      {loading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="destructive" size="sm" onClick={handleDisable}>
              <ShieldOff className="h-3 w-3 mr-1" /> Disable Access
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Dialog open={enableOpen} onOpenChange={(open) => { setEnableOpen(open); if (open) { setEmail(clientEmail); setPassword(generatePassword()); } }}>
      <DialogTrigger render={
        <Button variant="outline">
          <Shield className="h-4 w-4 mr-2" /> Enable Portal Access
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enable Portal Access</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Email (login credential)</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-muted-foreground">Auto-generated. Share this with the client.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEnableOpen(false)}>Cancel</Button>
            <Button onClick={handleEnable} disabled={loading || !email || !password}>
              {loading ? "Enabling..." : "Enable Access"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Add PortalAccess to client detail page**

In `src/app/(admin)/admin/clients/[id]/client-detail.tsx`, add the import:

```typescript
import { PortalAccess } from "./portal-access";
```

Add the PortalAccess component in the header area (after the edit button, before the KPI cards). The exact insertion point is after the header div and before the grid of KPI cards. Add:

```typescript
<PortalAccess
  clientId={client.id}
  clientEmail={client.email}
  portalUser={client.user ? { id: client.user.id, email: client.user.email, isActive: client.user.isActive } : null}
/>
```

Also update the component's type to include the `user` relation in the FullClient type.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(admin\)/admin/clients/
git commit -m "feat: add portal access UI with enable, reset password, disable"
```

---

## Task 4: Transaction Editing — Server Actions & Lock Check

**Files:**
- Modify: `src/app/(admin)/admin/transactions/actions.ts`

- [ ] **Step 1: Add lock checking helper and updateTransaction action**

Add to `src/app/(admin)/admin/transactions/actions.ts`:

```typescript
async function isMonthLocked(date: Date): Promise<boolean> {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  const rate = await db.monthlyInterestRate.findFirst({
    where: { month: monthStart, isLocked: true },
  });
  return !!rate;
}

export async function updateTransaction(id: string, input: CreateTransactionInput) {
  const user = await requireAdmin();
  const data = createTransactionSchema.parse(input);

  const existing = await db.fundTransaction.findUniqueOrThrow({ where: { id } });
  if (await isMonthLocked(new Date(existing.effectiveDate))) {
    throw new Error("Cannot edit transaction in a locked month");
  }

  const transaction = await db.fundTransaction.update({
    where: { id },
    data: {
      clientId: data.clientId,
      type: data.type,
      amount: data.amount,
      effectiveDate: data.effectiveDate,
      description: data.description || "",
      notes: data.notes || "",
    },
  });

  revalidatePath("/admin/transactions");
  revalidatePath("/admin/processing");
  return transaction;
}
```

Update the existing `deleteTransaction` to check lock:

```typescript
export async function deleteTransaction(id: string) {
  await requireAdmin();

  const existing = await db.fundTransaction.findUniqueOrThrow({ where: { id } });
  if (await isMonthLocked(new Date(existing.effectiveDate))) {
    throw new Error("Cannot delete transaction in a locked month");
  }

  await db.fundTransaction.delete({ where: { id } });
  revalidatePath("/admin/transactions");
  revalidatePath("/admin/processing");
}
```

Also export `isMonthLocked` so the table component can check lock status:

```typescript
export async function getTransactionLockStatus(effectiveDate: Date): Promise<boolean> {
  return isMonthLocked(effectiveDate);
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/transactions/actions.ts
git commit -m "feat: add transaction update action with month lock checking"
```

---

## Task 5: Transaction Editing — UI Changes

**Files:**
- Modify: `src/app/(admin)/admin/transactions/transaction-form.tsx`
- Modify: `src/app/(admin)/admin/transactions/transaction-table.tsx`
- Modify: `src/app/(admin)/admin/transactions/page.tsx`

- [ ] **Step 1: Update transaction form to support edit mode**

Modify `transaction-form.tsx` to accept an optional `transaction` prop for edit mode:

Add to the props type:
```typescript
type TransactionForEdit = {
  id: string;
  clientId: string;
  type: string;
  amount: number;
  effectiveDate: Date | string;
  description: string | null;
  notes: string | null;
};
```

Update the component signature:
```typescript
export function TransactionFormDialog({
  clients,
  transaction,
  trigger,
}: {
  clients: { id: string; name: string; clientCode: string }[];
  transaction?: TransactionForEdit;
  trigger: React.ReactNode;
})
```

Set `defaultValues` from the transaction prop when editing:
```typescript
const isEditing = !!transaction;

const form = useForm<CreateTransactionInput>({
  resolver: zodResolver(createTransactionSchema) as any,
  defaultValues: transaction
    ? {
        clientId: transaction.clientId,
        type: transaction.type as CreateTransactionInput["type"],
        amount: Number(transaction.amount),
        effectiveDate: new Date(transaction.effectiveDate),
        description: transaction.description ?? "",
        notes: transaction.notes ?? "",
      }
    : { type: "DEPOSIT" },
});
```

Update onSubmit to call either `updateTransaction` or `createTransaction`:
```typescript
import { createTransaction, updateTransaction } from "./actions";

async function onSubmit(data: CreateTransactionInput) {
  try {
    if (isEditing) {
      await updateTransaction(transaction.id, data);
      toast.success("Transaction updated");
    } else {
      await createTransaction(data);
      toast.success("Transaction recorded");
    }
    setOpen(false);
    if (!isEditing) form.reset();
    router.refresh();
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : "Failed to save transaction");
  }
}
```

Update the dialog title and submit button text:
```typescript
<DialogTitle>{isEditing ? "Edit Transaction" : "Record Transaction"}</DialogTitle>
...
<Button type="submit" disabled={form.formState.isSubmitting}>
  {form.formState.isSubmitting ? "Saving..." : isEditing ? "Update" : "Save Transaction"}
</Button>
```

- [ ] **Step 2: Update transaction table to add edit button**

Modify `transaction-table.tsx`:

Add import for the form and Pencil icon:
```typescript
import { TransactionFormDialog } from "./transaction-form";
import { Pencil, Trash2 } from "lucide-react";
```

Update props to include clients list:
```typescript
export function TransactionTable({
  transactions,
  clients,
}: {
  transactions: TransactionWithClient[];
  clients: { id: string; name: string; clientCode: string }[];
})
```

In each table row, add an edit button before the delete button in the actions cell:
```typescript
<TableCell>
  <div className="flex gap-1">
    <TransactionFormDialog
      clients={clients}
      transaction={{
        id: t.id,
        clientId: t.clientId,
        type: t.type,
        amount: Number(t.amount),
        effectiveDate: t.effectiveDate,
        description: t.description,
        notes: t.notes,
      }}
      trigger={
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      }
    />
    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</TableCell>
```

- [ ] **Step 3: Update transactions page to pass clients to table**

In `page.tsx`, update the TransactionTable call:
```typescript
<TransactionTable transactions={transactions} clients={clients} />
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

- [ ] **Step 5: Commit**

```bash
git add src/app/\(admin\)/admin/transactions/
git commit -m "feat: add transaction editing with edit button, lock checking"
```

---

## Task 6: Client Settings Tab

**Files:**
- Create: `src/app/(admin)/admin/clients/[id]/client-settings-form.tsx`
- Modify: `src/app/(admin)/admin/clients/[id]/client-detail.tsx`
- Modify: `src/lib/validations/client.ts`

- [ ] **Step 1: Update clientSettingsSchema to include cashFlowMode**

In `src/lib/validations/client.ts`, add `cashFlowMode` to the schema:

```typescript
export const clientSettingsSchema = z.object({
  rebateEnabled: z.boolean(),
  rebatePercentage: z.coerce.number().min(0).max(1),
  withholdingTaxEnabled: z.boolean(),
  withholdingTaxRate: z.coerce.number().min(0).max(1),
  disclaimerType: z.enum(["STD", "FI", "CUSTOM"]),
  customDisclaimerText: z.string().optional().default(""),
  interestRepaidType: z.enum(["NORMAL", "ACCRUED"]),
  cashFlowMode: z.enum(["WITH", "WITHOUT"]),
});
```

- [ ] **Step 2: Create client settings form component**

Create `src/app/(admin)/admin/clients/[id]/client-settings-form.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientSettingsSchema, type ClientSettingsInput } from "@/lib/validations/client";
import { updateClientSettings } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
  const router = useRouter();

  const form = useForm<ClientSettingsInput>({
    resolver: zodResolver(clientSettingsSchema) as any,
    defaultValues: {
      rebateEnabled: settings.rebateEnabled,
      rebatePercentage: Number(settings.rebatePercentage),
      withholdingTaxEnabled: settings.withholdingTaxEnabled,
      withholdingTaxRate: Number(settings.withholdingTaxRate),
      disclaimerType: settings.disclaimerType as ClientSettingsInput["disclaimerType"],
      customDisclaimerText: settings.customDisclaimerText ?? "",
      interestRepaidType: settings.interestRepaidType as ClientSettingsInput["interestRepaidType"],
      cashFlowMode: settings.cashFlowMode as ClientSettingsInput["cashFlowMode"],
    },
  });

  const disclaimerType = form.watch("disclaimerType");
  const rebateEnabled = form.watch("rebateEnabled");
  const withholdingTaxEnabled = form.watch("withholdingTaxEnabled");

  async function onSubmit(data: ClientSettingsInput) {
    try {
      await updateClientSettings(clientId, data);
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statement Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Disclaimer Type</Label>
              <Select
                value={disclaimerType}
                onValueChange={(v) => v && form.setValue("disclaimerType", v as ClientSettingsInput["disclaimerType"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STD">Standard (STD)</SelectItem>
                  <SelectItem value="FI">Foreign Investor (FI)</SelectItem>
                  <SelectItem value="CUSTOM">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Interest Repaid Type</Label>
              <Select
                value={form.watch("interestRepaidType")}
                onValueChange={(v) => v && form.setValue("interestRepaidType", v as ClientSettingsInput["interestRepaidType"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NORMAL">Normal — Interest Repaid</SelectItem>
                  <SelectItem value="ACCRUED">FI — Net Interest Repaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cash Flow Mode</Label>
              <Select
                value={form.watch("cashFlowMode")}
                onValueChange={(v) => v && form.setValue("cashFlowMode", v as ClientSettingsInput["cashFlowMode"])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WITH">WITH External Cashflow</SelectItem>
                  <SelectItem value="WITHOUT">WITHOUT External Cashflow</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Show Rebate</Label>
                <p className="text-xs text-muted-foreground">Enable discretionary rebate for this client</p>
              </div>
              <Switch
                checked={rebateEnabled}
                onCheckedChange={(checked) => form.setValue("rebateEnabled", checked)}
              />
            </div>
            {rebateEnabled && (
              <div className="space-y-2 pl-4">
                <Label>Rebate Percentage</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  {...form.register("rebatePercentage")}
                  placeholder="e.g. 0.15 for 15%"
                />
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div>
                <Label>Withholding Tax</Label>
                <p className="text-xs text-muted-foreground">Apply withholding tax (WHT) for foreign investors</p>
              </div>
              <Switch
                checked={withholdingTaxEnabled}
                onCheckedChange={(checked) => form.setValue("withholdingTaxEnabled", checked)}
              />
            </div>
            {withholdingTaxEnabled && (
              <div className="space-y-2 pl-4">
                <Label>Withholding Tax Rate</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  {...form.register("withholdingTaxRate")}
                  placeholder="e.g. 0.10 for 10%"
                />
              </div>
            )}
          </div>

          {disclaimerType === "CUSTOM" && (
            <div className="space-y-2">
              <Label>Custom Disclaimer Text</Label>
              <textarea
                className="w-full min-h-[100px] rounded-md border bg-background px-3 py-2 text-sm"
                {...form.register("customDisclaimerText")}
              />
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Add Settings tab to client detail**

In `client-detail.tsx`, add import:
```typescript
import { ClientSettingsForm } from "./client-settings-form";
```

Add a new tab trigger and content:
```typescript
<TabsTrigger value="settings">Settings</TabsTrigger>
```

```typescript
<TabsContent value="settings" className="mt-4">
  {client.clientSettings && (
    <ClientSettingsForm
      clientId={client.id}
      settings={{
        rebateEnabled: client.clientSettings.rebateEnabled,
        rebatePercentage: Number(client.clientSettings.rebatePercentage),
        withholdingTaxEnabled: client.clientSettings.withholdingTaxEnabled,
        withholdingTaxRate: Number(client.clientSettings.withholdingTaxRate),
        disclaimerType: client.clientSettings.disclaimerType,
        customDisclaimerText: client.clientSettings.customDisclaimerText,
        interestRepaidType: client.clientSettings.interestRepaidType,
        cashFlowMode: client.clientSettings.cashFlowMode,
      }}
    />
  )}
</TabsContent>
```

- [ ] **Step 4: Update updateClientSettings action to include cashFlowMode**

In `src/app/(admin)/admin/clients/actions.ts`, update the `updateClientSettings` function to include `cashFlowMode`:

```typescript
export async function updateClientSettings(
  clientId: string,
  input: ClientSettingsInput
) {
  await requireAdmin();
  const data = clientSettingsSchema.parse(input);

  await db.clientSettings.update({
    where: { clientId },
    data: {
      rebateEnabled: data.rebateEnabled,
      rebatePercentage: data.rebatePercentage,
      withholdingTaxEnabled: data.withholdingTaxEnabled,
      withholdingTaxRate: data.withholdingTaxRate,
      disclaimerType: data.disclaimerType,
      customDisclaimerText: data.customDisclaimerText || null,
      interestRepaidType: data.interestRepaidType,
      cashFlowMode: data.cashFlowMode,
    },
  });

  revalidatePath(`/admin/clients/${clientId}`);
}
```

- [ ] **Step 5: Install Switch component if not already present**

```bash
npx shadcn@latest add switch
```

- [ ] **Step 6: Verify build passes**

```bash
npm run build
```

- [ ] **Step 7: Commit**

```bash
git add src/app/\(admin\)/admin/clients/ src/lib/validations/client.ts
git commit -m "feat: add client settings tab with disclaimer, rebate, withholding tax, cash flow"
```

---

## Task 7: Settings Page — Company Details & Disclaimers

**Files:**
- Modify: `src/app/(admin)/admin/settings/actions.ts`
- Create: `src/app/(admin)/admin/settings/company-settings-form.tsx`
- Create: `src/app/(admin)/admin/settings/fiscal-year-form.tsx`
- Modify: `src/app/(admin)/admin/settings/page.tsx`

- [ ] **Step 1: Add company settings server actions**

In `src/app/(admin)/admin/settings/actions.ts`, add:

```typescript
export async function getCompanySettings() {
  let settings = await db.companySettings.findFirst();
  if (!settings) {
    settings = await db.companySettings.create({ data: { id: "default" } });
  }
  return settings;
}

export async function updateCompanySettings(data: {
  companyName: string;
  acn: string;
  addressLine1: string;
  addressLine2?: string;
  email: string;
  phone?: string;
  stdDisclaimerText: string;
  fiDisclaimerText: string;
}) {
  await requireAdmin();

  const settings = await getCompanySettings();

  await db.companySettings.update({
    where: { id: settings.id },
    data: {
      companyName: data.companyName,
      acn: data.acn,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      email: data.email,
      phone: data.phone || null,
      stdDisclaimerText: data.stdDisclaimerText,
      fiDisclaimerText: data.fiDisclaimerText,
    },
  });

  revalidatePath("/admin/settings");
}
```

- [ ] **Step 2: Create company settings form**

Create `src/app/(admin)/admin/settings/company-settings-form.tsx`:

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { updateCompanySettings } from "./actions";

type CompanySettingsFormProps = {
  settings: {
    companyName: string;
    acn: string;
    addressLine1: string;
    addressLine2: string | null;
    email: string;
    phone: string | null;
    stdDisclaimerText: string;
    fiDisclaimerText: string;
  };
};

export function CompanySettingsForm({ settings }: CompanySettingsFormProps) {
  const router = useRouter();
  const [data, setData] = useState(settings);
  const [saving, setSaving] = useState(false);

  function update(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateCompanySettings({
        companyName: data.companyName,
        acn: data.acn,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || undefined,
        email: data.email,
        phone: data.phone || undefined,
        stdDisclaimerText: data.stdDisclaimerText,
        fiDisclaimerText: data.fiDisclaimerText,
      });
      toast.success("Settings saved");
      router.refresh();
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input value={data.companyName} onChange={(e) => update("companyName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>ACN</Label>
              <Input value={data.acn} onChange={(e) => update("acn", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address Line 1</Label>
              <Input value={data.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Address Line 2</Label>
              <Input value={data.addressLine2 ?? ""} onChange={(e) => update("addressLine2", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={data.email} onChange={(e) => update("email", e.target.value)} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={data.phone ?? ""} onChange={(e) => update("phone", e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disclaimer Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Standard Disclaimer (STD)</Label>
            <textarea
              className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
              value={data.stdDisclaimerText}
              onChange={(e) => update("stdDisclaimerText", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Foreign Investor Disclaimer (FI)</Label>
            <textarea
              className="w-full min-h-[80px] rounded-md border bg-background px-3 py-2 text-sm"
              value={data.fiDisclaimerText}
              onChange={(e) => update("fiDisclaimerText", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create fiscal year form dialog**

Create `src/app/(admin)/admin/settings/fiscal-year-form.tsx`:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { createFiscalYear } from "./actions";
import { Plus } from "lucide-react";

export function FiscalYearFormDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!label || !startDate || !endDate) return;
    setSaving(true);
    try {
      await createFiscalYear({
        label,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      toast.success("Fiscal year created");
      setOpen(false);
      setLabel("");
      setStartDate("");
      setEndDate("");
      router.refresh();
    } catch {
      toast.error("Failed to create fiscal year");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm">
          <Plus className="h-3 w-3 mr-1" /> New Fiscal Year
        </Button>
      } />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Fiscal Year</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="FY 2026-27" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !label || !startDate || !endDate}>
              {saving ? "Creating..." : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Rewrite settings page to include all sections**

Replace `src/app/(admin)/admin/settings/page.tsx`:

```typescript
import { getFiscalYears, getCompanySettings } from "./actions";
import { CompanySettingsForm } from "./company-settings-form";
import { FiscalYearFormDialog } from "./fiscal-year-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const [fiscalYears, companySettings] = await Promise.all([
    getFiscalYears(),
    getCompanySettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">System configuration and master data</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Fiscal Years</CardTitle>
            <FiscalYearFormDialog />
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {fiscalYears.map((fy) => (
            <div key={fy.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{fy.label}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(fy.startDate).toLocaleDateString("en-AU")} –{" "}
                  {new Date(fy.endDate).toLocaleDateString("en-AU")}
                </div>
              </div>
              {fy.isCurrent && <Badge>Current</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>

      <CompanySettingsForm settings={companySettings} />
    </div>
  );
}
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

- [ ] **Step 6: Commit**

```bash
git add src/app/\(admin\)/admin/settings/
git commit -m "feat: add editable company settings, disclaimer templates, fiscal year creation"
```

---

## Task 8: Statement Generation Options Enhancement

**Files:**
- Modify: `src/app/(admin)/admin/statements/statement-generator.tsx`

- [ ] **Step 1: Add balance type, interest period, and rate period selects**

In `statement-generator.tsx`, add three new state variables:

```typescript
const [balanceType, setBalanceType] = useState("PREV MON");
const [interestPeriod, setInterestPeriod] = useState("MONTH");
const [ratePeriod, setRatePeriod] = useState("%MONTH");
```

Add three new Select components in the grid (make it a 2-row grid — first row: client, type, period start, period end; second row: balance type, interest period, rate period, generate button):

```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
  {/* ... existing client, type, period start, period end fields ... */}
</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-4">
  <div className="space-y-2">
    <Label>Balance Type</Label>
    <Select value={balanceType} onValueChange={(v) => v && setBalanceType(v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="OPEN">Opening Balance</SelectItem>
        <SelectItem value="PREV MON">Previous Month&apos;s Closing</SelectItem>
        <SelectItem value="PREV QTR">Previous Quarter&apos;s Closing</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="space-y-2">
    <Label>Interest Earned Label</Label>
    <Select value={interestPeriod} onValueChange={(v) => v && setInterestPeriod(v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="MONTH">Interest Earned This Month</SelectItem>
        <SelectItem value="MONTH FI">Gross Interest Earned This Month</SelectItem>
        <SelectItem value="QUARTER">Interest Earned This Quarter</SelectItem>
        <SelectItem value="QUARTER FI">Gross Interest Earned This Quarter</SelectItem>
        <SelectItem value="EOFY">Interest Earned This FY</SelectItem>
        <SelectItem value="EOFY FI">Gross Interest Earned This FY</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <div className="space-y-2">
    <Label>Interest Rate Label</Label>
    <Select value={ratePeriod} onValueChange={(v) => v && setRatePeriod(v)}>
      <SelectTrigger><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem value="%MONTH">Interest Rate This Month</SelectItem>
        <SelectItem value="%MONTH FI">Gross Interest Rate This Month</SelectItem>
        <SelectItem value="%QUARTER">Interest Rate This Quarter</SelectItem>
        <SelectItem value="%QUARTER FI">Gross Interest Rate This Quarter</SelectItem>
        <SelectItem value="%EOFY">Interest Rate This FY</SelectItem>
        <SelectItem value="%EOFY FI">Gross Interest Rate This FY</SelectItem>
      </SelectContent>
    </Select>
  </div>
  <Button onClick={handleGenerate} disabled={generating || !clientId}>
    {generating ? "Generating..." : "Generate"}
  </Button>
</div>
```

These options are display labels for the PDF — they don't change the data, only the labeling. They can be passed through to the generate action and stored as metadata in a future iteration. For now, they serve as the admin's reference for which statement variant to generate.

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(admin\)/admin/statements/statement-generator.tsx
git commit -m "feat: add balance type, interest period, rate period selects to statement generator"
```

---

## Task 9: Seed Default Company Settings & Final Verification

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add company settings to seed script**

In `prisma/seed.ts`, add after the fiscal year creation block:

```typescript
await prisma.companySettings.upsert({
  where: { id: "default" },
  update: {},
  create: { id: "default" },
});
console.log("✓ Default company settings created");
```

- [ ] **Step 2: Run seed**

```bash
npx prisma db seed
```

Expected: "Default company settings created" message.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: All tests pass (7/7 — calculation engine + statement number generator).

- [ ] **Step 4: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 5: Build**

```bash
npm run build
```

Expected: All routes compile successfully.

- [ ] **Step 6: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed default company settings, verify all enhancements"
```
