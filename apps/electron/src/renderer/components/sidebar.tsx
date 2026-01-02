import { NavLink } from "react-router-dom";
import { Logo } from "@repo/ui/logo";
import { cn } from "@repo/ui/utils";
import {
  CheckSquareIcon,
  HomeIcon,
  InfoIcon,
  SettingsIcon,
} from "lucide-react";

const pageLinks = [
  {
    to: "/",
    label: "Home",
    icon: HomeIcon,
  },
  {
    to: "/todos",
    label: "Todos",
    icon: CheckSquareIcon,
  },
  {
    to: "/settings",
    label: "Settings",
    icon: SettingsIcon,
  },
  {
    to: "/about",
    label: "About",
    icon: InfoIcon,
  },
];

export function Sidebar() {
  return (
    <nav className="drag-region sticky top-0 flex h-full w-[80px] flex-col items-center overflow-x-hidden overflow-y-auto border-r px-4 py-8">
      <div className="no-drag flex flex-col">
        <div className="flex justify-center pb-2">
          <NavLink to="/">
            <Logo className="bg-muted text-primary size-10 rounded-lg" />
            <span className="sr-only">Init</span>
          </NavLink>
        </div>
        {pageLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/"}
            className={({ isActive }) =>
              cn(
                "group flex flex-col items-center gap-1 p-2 text-xs",
                isActive && "text-primary",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-lg transition",
                    isActive ? "bg-secondary" : "group-hover:bg-secondary",
                  )}
                >
                  <link.icon className="size-4" />
                </span>
                <span>{link.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
