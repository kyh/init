import { useTheme } from "@repo/ui/theme";
import { cn } from "@repo/ui/utils";
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { PageHeader } from "../components/page-header";

const themes = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-full flex-col px-5">
      <PageHeader description="Customize your application preferences.">
        Settings
      </PageHeader>
      <div className="mx-auto w-full max-w-2xl space-y-8">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Appearance</h2>
            <p className="text-muted-foreground text-sm">
              Choose your preferred theme for the application.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "border-border flex flex-col items-center gap-3 rounded-lg border p-4 transition",
                  theme === value
                    ? "border-primary bg-secondary"
                    : "hover:bg-muted",
                )}
              >
                <Icon className="size-8" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
