import type { ReactNode } from "react";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { MoreHorizontalIcon } from "lucide-react";

export const TableRowActions = ({ children }: { children: ReactNode }) => (
  <DropdownMenu>
    <DropdownMenuTrigger render={<Button aria-label="Open menu" variant="ghost" size="icon" />}>
      <MoreHorizontalIcon />
    </DropdownMenuTrigger>
    <DropdownMenuContent>{children}</DropdownMenuContent>
  </DropdownMenu>
);
