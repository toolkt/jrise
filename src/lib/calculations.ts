export type ClientBalance = {
  clientId: string;
  balance: number;
};

export type MonthlyTransaction = {
  clientId: string;
  type: string;
  amount: number;
};

export type CalculatedRecord = {
  clientId: string;
  openingBalance: number;
  closingBalance: number;
  interestEarned: number;
  interestRateApplied: number;
  percentageShare: number;
};

const ADDITION_TYPES = new Set(["DEPOSIT", "REBATE"]);
const DEDUCTION_TYPES = new Set(["WITHDRAWAL", "INTEREST_REPAID", "CAPITAL_REDUCTION", "MISCELLANEOUS"]);

export function calculateClientShares(balances: ClientBalance[]): Map<string, number> {
  const total = balances.reduce((sum, b) => sum + b.balance, 0);
  const shares = new Map<string, number>();
  for (const b of balances) {
    shares.set(b.clientId, total === 0 ? 0 : b.balance / total);
  }
  return shares;
}

export function calculateMonthlyRecords(
  previousBalances: ClientBalance[],
  monthlyRate: number,
  transactions: MonthlyTransaction[]
): CalculatedRecord[] {
  const shares = calculateClientShares(previousBalances);

  const txByClient = new Map<string, { additions: number; deductions: number }>();
  for (const tx of transactions) {
    const current = txByClient.get(tx.clientId) ?? { additions: 0, deductions: 0 };
    if (ADDITION_TYPES.has(tx.type)) {
      current.additions += tx.amount;
    } else if (DEDUCTION_TYPES.has(tx.type)) {
      current.deductions += tx.amount;
    }
    txByClient.set(tx.clientId, current);
  }

  return previousBalances.map((b) => {
    const opening = b.balance;
    const interestEarned = opening * monthlyRate;
    const tx = txByClient.get(b.clientId) ?? { additions: 0, deductions: 0 };
    const closing = opening + interestEarned + tx.additions - tx.deductions;

    return {
      clientId: b.clientId,
      openingBalance: opening,
      closingBalance: Math.round(closing * 100) / 100,
      interestEarned: Math.round(interestEarned * 100) / 100,
      interestRateApplied: monthlyRate,
      percentageShare: shares.get(b.clientId) ?? 0,
    };
  });
}
