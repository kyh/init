"use client";

import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import { DownloadIcon, Loader2Icon, RotateCwIcon, TriangleAlertIcon } from "lucide-react";

import type { DesktopUpdateState } from "@/lib/desktop-bridge";

const FLOATING_CLASS = "fixed right-4 bottom-4 z-50 w-full max-w-sm";

/** Updates download and install only on user action. Inert outside Electron. */
export function DesktopUpdateBanner() {
  const [updateState, setUpdateState] = useState<DesktopUpdateState | null>(null);

  useEffect(() => {
    const { desktopBridge } = window;
    if (!desktopBridge) return;

    const unsubscribe = desktopBridge.onUpdateState(setUpdateState);
    void desktopBridge.checkForUpdates().then(setUpdateState);
    return unsubscribe;
  }, []);

  if (!updateState) return null;

  const handleDownload = () => {
    void window.desktopBridge?.downloadUpdate().then(setUpdateState);
  };

  const handleInstall = () => {
    void window.desktopBridge?.installUpdate().then(setUpdateState);
  };

  const handleRetry = () => {
    void window.desktopBridge?.checkForUpdates().then(setUpdateState);
  };

  switch (updateState.status) {
    case "idle":
    case "checking":
    case "not-available":
      return null;

    case "available":
      return (
        <Card size="sm" role="status" className={FLOATING_CLASS}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DownloadIcon className="text-muted-foreground size-4" />
              <CardTitle>Update available</CardTitle>
            </div>
            <CardDescription>Version {updateState.version} is ready to download.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button size="sm" onClick={handleDownload}>
              Download
            </Button>
          </CardFooter>
        </Card>
      );

    case "downloading":
      return (
        <Card size="sm" role="status" className={FLOATING_CLASS}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Loader2Icon className="text-muted-foreground size-4 animate-spin" />
              <CardTitle>Downloading update…</CardTitle>
            </div>
            <CardDescription>{updateState.downloadPercent}% complete</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={updateState.downloadPercent} />
          </CardContent>
        </Card>
      );

    case "downloaded":
      return (
        <Card size="sm" role="status" className={FLOATING_CLASS}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <RotateCwIcon className="text-muted-foreground size-4" />
              <CardTitle>Update ready</CardTitle>
            </div>
            <CardDescription>Restart to finish installing the update.</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button size="sm" onClick={handleInstall}>
              Restart
            </Button>
          </CardFooter>
        </Card>
      );

    case "error":
      return (
        <Card size="sm" role="status" className={FLOATING_CLASS}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TriangleAlertIcon className="text-destructive size-4" />
              <CardTitle>Update failed</CardTitle>
            </div>
            <CardDescription>{updateState.message}</CardDescription>
          </CardHeader>
          <CardFooter className="justify-end">
            <Button size="sm" variant="outline" onClick={handleRetry}>
              Retry
            </Button>
          </CardFooter>
        </Card>
      );
  }
}
