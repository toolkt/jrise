import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { StatementData } from "@/lib/pdf";

const DEFAULT_DISCLAIMER =
  "This statement is provided for information purposes only. JRISE Smart Trading Pty Ltd is not a licensed financial advisor. Past performance is not indicative of future results. Please consult your financial advisor for investment advice.";

const fmt = (n: number) =>
  n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtPct = (n: number) =>
  (n * 100).toLocaleString("en-AU", { minimumFractionDigits: 4, maximumFractionDigits: 4 }) + "%";

const fmtMonth = (d: Date) => {
  const date = new Date(d);
  return date.toLocaleString("en-AU", { month: "long", year: "numeric" });
};

const fmtDate = (d: Date) => {
  const date = new Date(d);
  return date.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    color: "#1a1a1a",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  companyTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#0a3d62",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerLabel: {
    fontSize: 8,
    color: "#666",
  },
  headerValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#0a3d62",
    marginBottom: 12,
  },
  addressBlock: {
    marginBottom: 16,
  },
  addressName: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 9,
    color: "#333",
  },
  closingBalanceBox: {
    border: "2px solid #0a3d62",
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "#f0f6ff",
  },
  closingBalanceLabel: {
    fontSize: 10,
    color: "#0a3d62",
    marginBottom: 4,
  },
  closingBalanceAmount: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#0a3d62",
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#0a3d62",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  rowLabel: {
    color: "#444",
  },
  rowValue: {
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0a3d62",
    color: "#fff",
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e0e0e0",
  },
  tableCell: {
    fontSize: 8,
  },
  colMonth: {
    width: "60%",
  },
  colAmount: {
    width: "20%",
    textAlign: "right",
  },
  colRate: {
    width: "20%",
    textAlign: "right",
  },
  disclaimer: {
    fontSize: 7,
    color: "#666",
    marginTop: 16,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#888",
  },
});

export function StatementPDF({ data }: { data: StatementData }) {
  const disclaimerText =
    data.client.clientSettings?.disclaimerType === "CUSTOM" &&
    data.client.clientSettings?.customDisclaimerText
      ? data.client.clientSettings.customDisclaimerText
      : DEFAULT_DISCLAIMER;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyTitle}>JRISE Smart Trading</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>Statement No.</Text>
            <Text style={styles.headerValue}>{data.statementNumber}</Text>
            <Text style={styles.headerLabel}>Period</Text>
            <Text style={styles.headerValue}>
              {fmtDate(data.periodStart)} – {fmtDate(data.periodEnd)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Client Address */}
        <View style={styles.addressBlock}>
          <Text style={styles.addressName}>{data.client.name}</Text>
          <Text style={styles.addressLine}>{data.client.addressLine1}</Text>
          {data.client.addressLine2 && (
            <Text style={styles.addressLine}>{data.client.addressLine2}</Text>
          )}
          {data.client.addressLine3 && (
            <Text style={styles.addressLine}>{data.client.addressLine3}</Text>
          )}
          {data.client.addressLine4 && (
            <Text style={styles.addressLine}>{data.client.addressLine4}</Text>
          )}
        </View>

        {/* Closing Balance Box */}
        <View style={styles.closingBalanceBox}>
          <Text style={styles.closingBalanceLabel}>CLOSING BALANCE</Text>
          <Text style={styles.closingBalanceAmount}>
            ${fmt(data.closingBalance)}
          </Text>
        </View>

        {/* Quick Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Quick Summary</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Previous Balance</Text>
            <Text style={styles.rowValue}>${fmt(data.previousBalance)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Interest Earned This Period</Text>
            <Text style={styles.rowValue}>${fmt(data.interestEarnedPeriod)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Interest Rate (Period Avg)</Text>
            <Text style={styles.rowValue}>{fmtPct(data.interestRatePeriod)}</Text>
          </View>
        </View>

        {/* YTD Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Year to Date Statistics</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Opening Balance (Principal)</Text>
            <Text style={styles.rowValue}>${fmt(data.openingPrincipal)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Interest Rate (Avg)</Text>
            <Text style={styles.rowValue}>{fmtPct(data.ytdInterestRate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Interest Earned</Text>
            <Text style={styles.rowValue}>${fmt(data.ytdInterestEarned)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Funds Added</Text>
            <Text style={styles.rowValue}>${fmt(data.ytdFundsAdded)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Interest Repaid</Text>
            <Text style={styles.rowValue}>${fmt(data.ytdInterestRepaid)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Capital Reduction</Text>
            <Text style={styles.rowValue}>${fmt(data.ytdCapitalReduction)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Misc Deductions</Text>
            <Text style={styles.rowValue}>${fmt(data.ytdMiscDeductions)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Misc Additions</Text>
            <Text style={styles.rowValue}>${fmt(data.ytdMiscAdditions)}</Text>
          </View>
        </View>

        {/* Monthly Earnings Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Earnings Breakdown</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colMonth]}>Month</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>($)</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>(%)</Text>
          </View>
          {data.monthlyBreakdown.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colMonth]}>
                {fmtMonth(item.month)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {fmt(item.earned)}
              </Text>
              <Text style={[styles.tableCell, styles.colRate]}>
                {fmtPct(item.rate)}
              </Text>
            </View>
          ))}
        </View>

        {/* Miscellaneous Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Miscellaneous Statistics</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Trading Months (YTD)</Text>
            <Text style={styles.rowValue}>{data.tradingMonths}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>YTD Interest Rate (%)</Text>
            <Text style={styles.rowValue}>{fmtPct(data.ytdInterestRate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Avg Monthly Earned</Text>
            <Text style={styles.rowValue}>${fmt(data.avgMonthlyEarned)}</Text>
          </View>
        </View>

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>{disclaimerText}</Text>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            JRISE Smart Trading Pty Ltd | ABN 00 000 000 000
          </Text>
          <Text style={styles.footerText}>
            Statement {data.statementNumber} | Generated{" "}
            {fmtDate(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
