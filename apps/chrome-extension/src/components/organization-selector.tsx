import { useState } from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import { ChevronDown, Building2, Check } from "lucide-react";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

type OrganizationSelectorProps = {
  organizations: Organization[];
  activeOrganization: Organization | null;
  onSelect: (org: Organization) => void;
  isLoading?: boolean;
};

export function OrganizationSelector({
  organizations,
  activeOrganization,
  onSelect,
  isLoading,
}: OrganizationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border px-3">
        <Building2 className="size-4 animate-pulse" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="flex h-9 items-center gap-2 rounded-md border px-3">
        <Building2 className="size-4" />
        <span className="text-sm text-muted-foreground">No organizations</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <div className="flex items-center gap-2">
          {activeOrganization?.logo ? (
            <img
              src={activeOrganization.logo}
              alt={activeOrganization.name}
              className="size-4 rounded"
            />
          ) : (
            <Building2 className="size-4" />
          )}
          <span className="truncate">
            {activeOrganization?.name ?? "Select organization"}
          </span>
        </div>
        <ChevronDown
          className={cn("size-4 transition-transform", isOpen && "rotate-180")}
        />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => {
                  onSelect(org);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent",
                  activeOrganization?.id === org.id && "bg-accent",
                )}
              >
                {org.logo ? (
                  <img
                    src={org.logo}
                    alt={org.name}
                    className="size-4 rounded"
                  />
                ) : (
                  <Building2 className="size-4" />
                )}
                <span className="flex-1 truncate text-left">{org.name}</span>
                {activeOrganization?.id === org.id && (
                  <Check className="size-4" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
