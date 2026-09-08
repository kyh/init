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

const UpdateCard = ({ children }: { children: React.ReactNode }) => (
  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Card renders a div; `output` is a form-result element, not a notification surface
  <Card size="sm" role="status" className={FLOATING_CLASS}>
    {children}
  </Card>
);

/** Updates download and install only on user action. Inert outside Electron. */
export const DesktopUpdateBanner = () => {
  const [updateState, setUpdateState] = useState<DesktopUpdateState | null>(null);

  useEffect(() => {
    const { desktopBridge } = window;
    if (!desktopBridge) {
      return;
    }

    const unsubscribe = desktopBridge.onUpdateState(setUpdateState);
    const check = async () => {
      setUpdateState(await desktopBridge.checkForUpdates());
    };
    void check();
    return unsubscribe;
  }, []);

  if (!updateState) {
    return null;
  }

  const handleDownload = async () => {
    const { desktopBridge } = window;
    if (desktopBridge) {
      setUpdateState(await desktopBridge.downloadUpdate());
    }
  };

  const handleInstall = async () => {
    const { desktopBridge } = window;
    if (desktopBridge) {
      setUpdateState(await desktopBridge.installUpdate());
    }
  };

  const handleRetry = async () => {
    const { desktopBridge } = window;
    if (desktopBridge) {
      setUpdateState(await desktopBridge.checkForUpdates());
    }
  };

  switch (updateState.status) {
    case "available": {
      return (
        <UpdateCard>
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
        </UpdateCard>
      );
    }

    case "downloading": {
      return (
        <UpdateCard>
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
        </UpdateCard>
      );
    }

    case "downloaded": {
      return (
        <UpdateCard>
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
        </UpdateCard>
      );
    }

    case "error": {
      return (
        <UpdateCard>
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
        </UpdateCard>
      );
    }

    default: {
      return null;
    }
  }
};
