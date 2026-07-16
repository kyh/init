"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Sits inside the dashboard layout, so the sidebar survives a failed page query
// and only the content area shows the boundary.
const DashboardError = ({ error, reset }: ErrorBoundaryProps) => {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Couldn&apos;t load this page</h1>
        <p className="text-muted-foreground">Something went wrong fetching your data.</p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
};

export default DashboardError;
