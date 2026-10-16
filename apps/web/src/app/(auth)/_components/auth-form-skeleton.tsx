import { Skeleton } from "@repo/ui/components/skeleton";

/** Holds a form's place (two fields and a button) while its page reads its search params. */
export const AuthFormSkeleton = () => (
  <div className="grid gap-2">
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-full" />
  </div>
);
