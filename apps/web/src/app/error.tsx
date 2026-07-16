"use client";

import { useEffect } from "react";
import { Button } from "@repo/ui/components/button";

type ErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const ErrorBoundary = ({ error, reset }: ErrorBoundaryProps) => {
  useEffect(() => {
    // Replace with your error reporting service
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-muted-foreground">
          An unexpected error occurred. Try again — if it keeps happening, the details are in the
          console.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
};

export default ErrorBoundary;
