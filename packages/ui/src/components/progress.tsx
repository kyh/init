"use client";

import { Progress as ProgressPrimitive } from "@base-ui/react/progress";

import { cn } from "cn";

const ProgressTrack = ({ className, ...props }: ProgressPrimitive.Track.Props) => (
  <ProgressPrimitive.Track
    className={cn(
      "relative flex h-1.5 w-full items-center overflow-x-hidden rounded-full bg-muted",
      className,
    )}
    data-slot="progress-track"
    {...props}
  />
);

const ProgressIndicator = ({ className, ...props }: ProgressPrimitive.Indicator.Props) => (
  <ProgressPrimitive.Indicator
    data-slot="progress-indicator"
    className={cn("h-full bg-primary transition-all", className)}
    {...props}
  />
);

const Progress = ({ className, children, value, ...props }: ProgressPrimitive.Root.Props) => (
  <ProgressPrimitive.Root
    value={value}
    data-slot="progress"
    className={cn("flex flex-wrap gap-3", className)}
    {...props}
  >
    {children}
    <ProgressTrack>
      <ProgressIndicator />
    </ProgressTrack>
  </ProgressPrimitive.Root>
);

const ProgressLabel = ({ className, ...props }: ProgressPrimitive.Label.Props) => (
  <ProgressPrimitive.Label
    className={cn("text-sm font-medium", className)}
    data-slot="progress-label"
    {...props}
  />
);

const ProgressValue = ({ className, ...props }: ProgressPrimitive.Value.Props) => (
  <ProgressPrimitive.Value
    className={cn("ml-auto text-sm text-muted-foreground tabular-nums", className)}
    data-slot="progress-value"
    {...props}
  />
);

export { Progress, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue };
