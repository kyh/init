import { useEffect, useState } from "react";
import { Logo } from "@repo/ui/logo";

import { PageHeader } from "../components/page-header";

export function AboutPage() {
  const [appVersion, setAppVersion] = useState<string>("");
  const [platform, setPlatform] = useState<string>("");

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const version = await window.api.getAppVersion();
        const plat = await window.api.getPlatform();
        setAppVersion(version);
        setPlatform(plat);
      } catch (error) {
        // Fallback for development or when API is not available
        setAppVersion("0.1.0");
        setPlatform("development");
      }
    };

    loadInfo();
  }, []);

  return (
    <div className="flex h-full flex-col px-5">
      <PageHeader description="Information about this application.">
        About
      </PageHeader>
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex flex-col items-center space-y-6 py-12 text-center">
          <Logo className="bg-muted text-primary size-20 rounded-2xl" />
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Init</h2>
            <p className="text-muted-foreground">
              A modern desktop application built with Electron and React.
            </p>
          </div>
          <div className="border-border rounded-lg border p-6">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Version</dt>
                <dd className="font-medium">{appVersion || "Loading..."}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Platform</dt>
                <dd className="font-medium capitalize">
                  {platform || "Loading..."}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Framework</dt>
                <dd className="font-medium">Electron + React</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Build Tool</dt>
                <dd className="font-medium">electron-vite</dd>
              </div>
            </dl>
          </div>
          <div className="text-muted-foreground text-xs">
            <p>Built with electron-vite, React, and Tailwind CSS</p>
            <p className="mt-1">
              &copy; {new Date().getFullYear()} Init. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
