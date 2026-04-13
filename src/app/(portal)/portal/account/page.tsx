import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PortalAccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const client = await db.client.findFirst({
    where: { userId: user.id },
  });

  if (!client) redirect("/login");

  const addressParts = [
    client.addressLine1,
    client.addressLine2,
    client.addressLine3,
    client.addressLine4,
  ].filter(Boolean);

  const details = [
    { label: "Full Name", value: client.name },
    { label: "Email Address", value: client.email },
    { label: "Mobile", value: client.mobile ?? "—" },
    { label: "Address", value: addressParts.join(", ") || "—" },
    { label: "Client Code", value: client.clientCode },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">My Account</h1>
        <p className="text-muted-foreground text-sm">
          Your account details on file with JRISE
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Personal Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {details.map((d) => (
              <li key={d.label} className="flex flex-col gap-0.5 px-6 py-3">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {d.label}
                </span>
                <span className="text-sm">{d.value}</span>
              </li>
            ))}
          </ul>
          <div className="px-6 py-4 border-t">
            <p className="text-xs text-muted-foreground">
              To update your details, please contact JRISE.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
