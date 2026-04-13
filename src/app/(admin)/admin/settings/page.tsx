import { getFiscalYears, getCompanySettings } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanySettingsForm } from "./company-settings-form";
import { FiscalYearFormDialog } from "./fiscal-year-form";

export default async function SettingsPage() {
  const [fiscalYears, companySettings] = await Promise.all([
    getFiscalYears(),
    getCompanySettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">System configuration</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Fiscal Years</CardTitle>
          <FiscalYearFormDialog />
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
      <CompanySettingsForm settings={companySettings} />
    </div>
  );
}
