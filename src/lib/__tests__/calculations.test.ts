import { describe, it, expect } from "vitest";
import {
  calculateClientShares,
  calculateMonthlyRecords,
  type ClientBalance,
  type MonthlyTransaction,
} from "../calculations";

describe("calculateClientShares", () => {
  it("calculates proportional shares based on balances", () => {
    const balances: ClientBalance[] = [
      { clientId: "a", balance: 75193.96 },
      { clientId: "b", balance: 180799.98 },
      { clientId: "c", balance: 43170.73 },
      { clientId: "d", balance: 30786.90 },
    ];
    const shares = calculateClientShares(balances);
    expect(shares.get("a")).toBeCloseTo(0.2279, 3);
    expect(shares.get("b")).toBeCloseTo(0.5480, 3);
    expect(shares.get("c")).toBeCloseTo(0.1308, 3);
    expect(shares.get("d")).toBeCloseTo(0.0933, 3);
  });

  it("handles a single client with 100% share", () => {
    const shares = calculateClientShares([{ clientId: "a", balance: 1000 }]);
    expect(shares.get("a")).toBe(1);
  });
});

describe("calculateMonthlyRecords", () => {
  it("calculates interest and closing balances for all clients", () => {
    const balances: ClientBalance[] = [
      { clientId: "a", balance: 75193.96 },
      { clientId: "b", balance: 180799.98 },
    ];
    const rate = 0.01796;
    const transactions: MonthlyTransaction[] = [
      { clientId: "a", type: "DEPOSIT", amount: 800 },
    ];

    const records = calculateMonthlyRecords(balances, rate, transactions);

    const recordA = records.find((r) => r.clientId === "a")!;
    expect(recordA.openingBalance).toBe(75193.96);
    expect(recordA.interestEarned).toBeCloseTo(75193.96 * 0.01796, 2);
    expect(recordA.closingBalance).toBeCloseTo(75193.96 + 75193.96 * 0.01796 + 800, 2);

    const recordB = records.find((r) => r.clientId === "b")!;
    expect(recordB.openingBalance).toBe(180799.98);
    expect(recordB.interestEarned).toBeCloseTo(180799.98 * 0.01796, 2);
    expect(recordB.closingBalance).toBeCloseTo(180799.98 + 180799.98 * 0.01796, 2);
  });

  it("subtracts withdrawals and repayments from closing balance", () => {
    const balances: ClientBalance[] = [{ clientId: "a", balance: 100000 }];
    const rate = 0.01;
    const transactions: MonthlyTransaction[] = [
      { clientId: "a", type: "WITHDRAWAL", amount: 5000 },
      { clientId: "a", type: "INTEREST_REPAID", amount: 500 },
    ];

    const records = calculateMonthlyRecords(balances, rate, transactions);
    const record = records[0];
    // 100000 + 1000 (interest) - 5000 - 500 = 95500
    expect(record.closingBalance).toBeCloseTo(95500, 2);
  });
});
