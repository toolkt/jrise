type StatementNumberInput = {
  type: "MONTHLY" | "QUARTERLY" | "ANNUAL" | "CUSTOM" | "CLOSE";
  clientCode: string;
  periodEnd?: Date;
  quarter?: number;
  sequence?: number;
  fiscalYearLabel?: string;
  customNumber?: string;
};

export function generateStatementNumber(input: StatementNumberInput): string {
  const code = input.clientCode.replace(/[^A-Z]/gi, "").toUpperCase();

  switch (input.type) {
    case "MONTHLY": {
      const d = input.periodEnd!;
      const yy = String(d.getFullYear()).slice(-2);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const seq = String(input.sequence ?? 1).padStart(4, "0");
      return `${yy}${mm}${code}${seq}`;
    }
    case "QUARTERLY": {
      const d = input.periodEnd!;
      const yy = String(d.getFullYear()).slice(-2);
      return `${yy}Q${input.quarter}${code}`;
    }
    case "ANNUAL": {
      return `EOFY${code}${input.fiscalYearLabel}`;
    }
    case "CUSTOM":
    case "CLOSE":
      return input.customNumber ?? `${code}-${Date.now()}`;
  }
}
