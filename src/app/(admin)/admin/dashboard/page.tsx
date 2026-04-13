import { getDashboardData } from "./actions";
import { KPICards } from "./kpi-cards";
import { MonthlyChart } from "./monthly-chart";
import { ShareChart } from "./share-chart";
import { ClientSummaryTable } from "./client-summary-table";

export default async function AdminDashboard() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-1">Fund Overview</h1>
        <p className="text-muted-foreground text-sm">
          No active fiscal year found. Please configure a fiscal year to view dashboard data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Fund Overview</h1>
        <p className="text-muted-foreground text-sm">
          {data.fiscalYear.label} — fiscal year summary
        </p>
      </div>

      <KPICards
        totalFundBalance={data.totalFundBalance}
        activeClientCount={data.activeClientCount}
        ytdInterest={data.ytdInterest}
        pendingStatements={data.pendingStatements}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyChart data={data.monthlyTotals} />
        </div>
        <ShareChart data={data.shareDistribution} />
      </div>

      <ClientSummaryTable clients={data.clientSummaries} />
    </div>
  );
}
