import { getFiscalYears } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const fiscalYears = await getFiscalYears();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">System configuration</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fiscal Years</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {fiscalYears.map((fy) => (
            <div key={fy.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <div className="font-medium">{fy.label}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(fy.startDate).toLocaleDateString("en-AU")} – {new Date(fy.endDate).toLocaleDateString("en-AU")}
                </div>
              </div>
              {fy.isCurrent && <Badge>Current</Badge>}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>JRISE Smart Trading Pty Limited</div>
          <div>ACN: 627 266 337</div>
          <div>PO Box 4399 North Rocks NSW 2151</div>
          <div>jerrold@jrise.com.au</div>
        </CardContent>
      </Card>
    </div>
  );
}
