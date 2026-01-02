import type { ReactNode } from "react";

type PageHeaderProps = {
  children: ReactNode;
  description?: string;
};

export function PageHeader({ children, description }: PageHeaderProps) {
  return (
    <header className="drag-region flex flex-col gap-1 pb-6 pt-8">
      <h1 className="text-2xl font-bold tracking-tight">{children}</h1>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
    </header>
  );
}
