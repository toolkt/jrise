"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, KeyRound, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { enablePortalAccess, resetPortalPassword, disablePortalAccess } from "../actions";

type PortalAccessProps = {
  clientId: string;
  clientEmail: string;
  portalUser: { id: string; email: string; isActive: boolean } | null;
};

function generatePassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function PortalAccess({ clientId, clientEmail, portalUser }: PortalAccessProps) {
  // Enable portal dialog state
  const [enableOpen, setEnableOpen] = useState(false);
  const [enableEmail, setEnableEmail] = useState(clientEmail);
  const [enablePassword, setEnablePassword] = useState(() => generatePassword());
  const [enableLoading, setEnableLoading] = useState(false);

  // Reset password dialog state
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState(() => generatePassword());
  const [resetLoading, setResetLoading] = useState(false);

  // Disable dialog state
  const [disableOpen, setDisableOpen] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  async function handleEnable() {
    setEnableLoading(true);
    try {
      await enablePortalAccess(clientId, enableEmail, enablePassword);
      toast.success("Portal access enabled");
      setEnableOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to enable portal access");
    } finally {
      setEnableLoading(false);
    }
  }

  async function handleReset() {
    setResetLoading(true);
    try {
      await resetPortalPassword(clientId, resetPassword);
      toast.success("Password reset successfully");
      setResetOpen(false);
      setResetPassword(generatePassword());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setResetLoading(false);
    }
  }

  async function handleDisable() {
    setDisableLoading(true);
    try {
      await disablePortalAccess(clientId);
      toast.success("Portal access disabled");
      setDisableOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to disable portal access");
    } finally {
      setDisableLoading(false);
    }
  }

  if (!portalUser) {
    return (
      <Dialog open={enableOpen} onOpenChange={setEnableOpen}>
        <DialogTrigger
          render={
            <Button variant="outline">
              <Shield className="h-4 w-4 mr-2" />
              Enable Portal Access
            </Button>
          }
        />
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enable Portal Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="portal-email">Email</Label>
              <Input
                id="portal-email"
                type="email"
                value={enableEmail}
                onChange={(e) => setEnableEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="portal-password">Password</Label>
              <Input
                id="portal-password"
                type="text"
                value={enablePassword}
                onChange={(e) => setEnablePassword(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEnableOpen(false)}
                disabled={enableLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleEnable} disabled={enableLoading}>
                {enableLoading ? "Enabling..." : "Enable Access"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Badge variant="default">Portal Active</Badge>
          </div>
          <span className="text-sm text-muted-foreground font-mono">{portalUser.email}</span>
          <div className="flex items-center gap-2 ml-auto">
            {/* Reset Password Dialog */}
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger
                render={
                  <Button variant="outline" size="sm">
                    <KeyRound className="h-4 w-4 mr-1" />
                    Reset Password
                  </Button>
                }
              />
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Reset Portal Password</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <Label htmlFor="reset-password">New Password</Label>
                    <Input
                      id="reset-password"
                      type="text"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setResetOpen(false)}
                      disabled={resetLoading}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleReset} disabled={resetLoading}>
                      {resetLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Disable Access Dialog */}
            <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
              <DialogTrigger
                render={
                  <Button variant="destructive" size="sm">
                    <ShieldOff className="h-4 w-4 mr-1" />
                    Disable Access
                  </Button>
                }
              />
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>Disable Portal Access</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to disable portal access for{" "}
                    <span className="font-medium text-foreground">{portalUser.email}</span>?
                    The user will no longer be able to log in.
                  </p>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDisableOpen(false)}
                      disabled={disableLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDisable}
                      disabled={disableLoading}
                    >
                      {disableLoading ? "Disabling..." : "Disable Access"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
