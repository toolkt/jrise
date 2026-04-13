"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCompanySettings } from "./actions";

interface CompanySettingsFormProps {
  settings: {
    companyName: string;
    acn: string;
    addressLine1: string;
    addressLine2?: string | null;
    email: string;
    phone?: string | null;
    stdDisclaimerText: string;
    fiDisclaimerText: string;
  };
}

export function CompanySettingsForm({ settings }: CompanySettingsFormProps) {
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [acn, setAcn] = useState(settings.acn);
  const [addressLine1, setAddressLine1] = useState(settings.addressLine1);
  const [addressLine2, setAddressLine2] = useState(settings.addressLine2 ?? "");
  const [email, setEmail] = useState(settings.email);
  const [phone, setPhone] = useState(settings.phone ?? "");
  const [stdDisclaimerText, setStdDisclaimerText] = useState(settings.stdDisclaimerText);
  const [fiDisclaimerText, setFiDisclaimerText] = useState(settings.fiDisclaimerText);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateCompanySettings({
        companyName,
        acn,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        email,
        phone: phone || undefined,
        stdDisclaimerText,
        fiDisclaimerText,
      });
      toast.success("Settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="acn">ACN</Label>
              <Input
                id="acn"
                value={acn}
                onChange={(e) => setAcn(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input
                id="addressLine1"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="addressLine2">Address Line 2</Label>
              <Input
                id="addressLine2"
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Disclaimer Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="stdDisclaimerText">STD Disclaimer</Label>
            <textarea
              id="stdDisclaimerText"
              value={stdDisclaimerText}
              onChange={(e) => setStdDisclaimerText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="fiDisclaimerText">FI Disclaimer</Label>
            <textarea
              id="fiDisclaimerText"
              value={fiDisclaimerText}
              onChange={(e) => setFiDisclaimerText(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save All Settings"}
      </Button>
    </div>
  );
}
