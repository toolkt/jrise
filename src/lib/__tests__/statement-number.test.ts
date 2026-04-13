import { describe, it, expect } from "vitest";
import { generateStatementNumber } from "../statement-number";

describe("generateStatementNumber", () => {
  it("generates monthly statement number", () => {
    const result = generateStatementNumber({
      type: "MONTHLY",
      clientCode: "AV",
      periodEnd: new Date("2026-03-31"),
      sequence: 21,
    });
    expect(result).toBe("2603AV0021");
  });

  it("generates quarterly statement number", () => {
    const result = generateStatementNumber({
      type: "QUARTERLY",
      clientCode: "AV",
      periodEnd: new Date("2026-03-31"),
      quarter: 3,
    });
    expect(result).toBe("26Q3AV");
  });

  it("generates annual statement number", () => {
    const result = generateStatementNumber({
      type: "ANNUAL",
      clientCode: "AV",
      fiscalYearLabel: "2526",
    });
    expect(result).toBe("EOFYAV2526");
  });
});
