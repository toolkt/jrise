import { type ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { PortalNav } from "@/components/portal/portal-nav";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const client = await db.client.findFirst({
    where: { userId: user.id },
  });

  if (!client) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <PortalNav clientName={client.name} />
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</main>
    </div>
  );
}
