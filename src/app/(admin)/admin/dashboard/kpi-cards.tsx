import { DollarSign, Users, TrendingUp, FileText } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

type KPICardsProps = {
  totalFundBalance: number;
  activeClientCount: number;
  ytdInterest: number;
  pendingStatements: number;
};

export function KPICards({
  totalFundBalance,
  activeClientCount,
  ytdInterest,
  pendingStatements,
}: KPICardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fund Balance</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalFundBalance)}</div>
          <p className="text-xs text-muted-foreground">Across all active clients</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeClientCount}</div>
          <p className="text-xs text-muted-foreground">Currently active accounts</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">YTD Interest Earned</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(ytdInterest)}</div>
          <p className="text-xs text-muted-foreground">This fiscal year</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Statements Pending</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingStatements}</div>
          <p className="text-xs text-muted-foreground">Awaiting delivery</p>
        </CardContent>
      </Card>
    </div>
  );
}
