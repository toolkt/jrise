import { getProcessingStatus } from "./actions";
import { ProcessingWizard } from "./processing-wizard";

export default async function ProcessingPage() {
  const { fiscalYear, rates } = await getProcessingStatus();
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Monthly Processing</h1>
        <p className="text-muted-foreground text-sm">
          {fiscalYear.label} · Process interest earnings and generate client records
        </p>
      </div>
      <ProcessingWizard fiscalYear={fiscalYear} rates={rates} />
    </div>
  );
}
