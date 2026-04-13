# JRISE Enhancements — Design Spec

**Date:** 2026-04-13
**Status:** Draft
**Scope:** Portal access, transaction editing, master data management

---

## 1. Overview

Three enhancement areas for the existing JRISE Investment Management System:
1. **Portal Access** — Enable/disable client portal login from the admin client detail page
2. **Transaction Editing** — Add edit capability to existing transactions (currently create/delete only)
3. **Master Data Management** — Company settings, disclaimer templates, client statement settings, and statement generation options

## 2. Feature 1: Portal Access Toggle

**Location:** Client detail page (`/admin/clients/[id]`)

### Enable Portal Access
- Button on client detail header area: "Enable Portal Access"
- Opens dialog with:
  - Email field (pre-filled from client.email, editable)
  - Password field (pre-filled with random 12-char alphanumeric, admin can override)
- On submit:
  - Create `User` record: email, bcrypt-hashed password, role=CLIENT, firstName/lastName from client name
  - Link to client: set `client.userId` to new user's id
  - Toast success with message "Portal access enabled"

### Active Portal State
- When `client.userId` is set and linked user exists:
  - Show "Portal Active" badge next to client name
  - Show linked email
  - "Reset Password" button — opens dialog with new password input (pre-filled random)
  - "Disable Access" button — sets user.isActive=false, unsets client.userId, confirms with dialog

### Server Actions (add to client actions.ts)
- `enablePortalAccess(clientId, email, password)` — creates user, links to client
- `resetPortalPassword(clientId, newPassword)` — updates user password hash
- `disablePortalAccess(clientId)` — deactivates user, unlinks from client

## 3. Feature 2: Transaction Editing

**Location:** Transactions page (`/admin/transactions`) and client detail transactions tab

### Edit Capability
- Add pencil icon button to each transaction row (next to existing delete button)
- Clicking opens the transaction form dialog pre-filled with existing data
- Form works in edit mode: shows "Update Transaction" instead of "Save Transaction"

### Server Action
- `updateTransaction(id, input)` — validates with createTransactionSchema, updates record
- Protected by `requireAdmin()`

### Lock Check
- Both edit and delete should check if the transaction's month is locked
- A month is locked if a `monthlyInterestRate` record exists for that month with `isLocked=true`
- If locked: disable edit/delete buttons, show tooltip "Month is locked"
- Server actions also enforce this check

## 4. Feature 3: Master Data Management

### 4.1 Database Changes

**New table: `company_settings`** (single-row configuration)

| Column | Type | Default |
|--------|------|---------|
| id | UUID (PK) | |
| company_name | VARCHAR | "JRISE Smart Trading Pty Limited" |
| acn | VARCHAR | "627 266 337" |
| address_line1 | VARCHAR | "PO Box 4399 North Rocks NSW 2151" |
| address_line2 | VARCHAR | nullable |
| email | VARCHAR | "jerrold@jrise.com.au" |
| phone | VARCHAR | nullable |
| std_disclaimer_text | TEXT | (standard disclaimer) |
| fi_disclaimer_text | TEXT | (foreign investor disclaimer) |
| updated_at | TIMESTAMP | |

**Add column to `client_settings`:**

| Column | Type | Default |
|--------|------|---------|
| cash_flow_mode | ENUM(WITH, WITHOUT) | WITHOUT |

### 4.2 Settings Page Enhancements (`/admin/settings`)

**Fiscal Years Section:**
- Existing: display list of fiscal years
- Add: "Create Fiscal Year" button opening dialog with fields: label, start date, end date
- New FY automatically becomes current (existing FYs set to isCurrent=false)

**Company Details Section:**
- Editable form (currently static text)
- Fields: company name, ACN, address line 1, address line 2, email, phone
- Save button persists to `company_settings` table
- Used by PDF statement header/footer (update `assembleStatementData` and `StatementPDF` to read from DB)

**Disclaimer Templates Section:**
- Two editable textareas:
  - STD: "Your statement does NOT incorporate any applicable taxes..."
  - FI: "Your statement includes a 10% Foreign Investor Withholding Tax..."
- Save button persists to `company_settings` table
- Used by statement PDF based on client's disclaimer_type setting

### 4.3 Client Settings Tab (Client Detail Page)

**New "Settings" tab** on the client detail page with editable form:

| Setting | UI Control | Stored In |
|---------|-----------|-----------|
| Disclaimer Type | Select: STD / FI | client_settings.disclaimer_type |
| Interest Repaid Type | Select: NORMAL / FI | client_settings.interest_repaid_type |
| Show Rebate | Toggle + number input (%) | client_settings.rebate_enabled + rebate_percentage |
| Withholding Tax | Toggle + number input (%) | client_settings.withholding_tax_enabled + withholding_tax_rate |
| Cash Flow Mode | Select: WITH / WITHOUT | client_settings.cash_flow_mode |
| Custom Disclaimer | Textarea (shown when disclaimer_type=CUSTOM) | client_settings.custom_disclaimer_text |

Save button calls existing `updateClientSettings` action (extend to include cash_flow_mode).

### 4.4 Statement Generation Options Enhancement

**Enhance the statement generator** (`/admin/statements`) with additional selects:

| Option | Select Values | Effect on PDF |
|--------|--------------|---------------|
| Balance Type | OPEN / PREV MON / PREV QTR | Controls which balance is shown as "previous balance" |
| Interest Earned Period | MONTH / MONTH FI / QUARTER / QUARTER FI / EOFY / EOFY FI | Controls the label and whether gross or net interest is shown |
| Interest Rate Period | %MONTH / %MONTH FI / %QUARTER / %QUARTER FI / %EOFY / %EOFY FI | Controls the label and whether gross or net rate is shown |

These are per-statement-generation choices, not stored as master data. They're passed to the PDF generator to control labeling.

## 5. Enum Updates

Update `DisclaimerType` enum: STD | FI | CUSTOM (add FI)
Add `CashFlowMode` enum: WITH | WITHOUT

## 6. Files Affected

### New Files
- Prisma migration for company_settings table + cash_flow_mode column + FI enum value

### Modified Files
- `prisma/schema.prisma` — new table, new enum, new column
- `src/app/(admin)/admin/clients/actions.ts` — add portal access actions
- `src/app/(admin)/admin/clients/[id]/client-detail.tsx` — add portal controls, settings tab
- `src/app/(admin)/admin/transactions/actions.ts` — add updateTransaction, lock checking
- `src/app/(admin)/admin/transactions/transaction-form.tsx` — edit mode support
- `src/app/(admin)/admin/transactions/transaction-table.tsx` — edit button, lock UI
- `src/app/(admin)/admin/settings/actions.ts` — company settings CRUD, fiscal year creation
- `src/app/(admin)/admin/settings/page.tsx` — editable forms for all sections
- `src/app/(admin)/admin/statements/statement-generator.tsx` — additional select options
- `src/lib/pdf.ts` — read company settings, apply statement generation options
- `src/components/statements/statement-pdf.tsx` — use company settings for header/footer/disclaimer
- `prisma/seed.ts` — seed default company settings
