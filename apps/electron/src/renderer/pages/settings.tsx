import { useTheme } from "@repo/ui/theme";
import { Button } from "@repo/ui/button";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import { MonitorIcon, MoonIcon, SunIcon, TrashIcon } from "lucide-react";

import { PageHeader } from "../components/page-header";
import { useClearAllTodos } from "../lib/todos";

const themes = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const clearAllTodos = useClearAllTodos();

  const handleClearData = async () => {
    try {
      await clearAllTodos.mutateAsync();
      toast.success("All data has been cleared");
    } catch {
      toast.error("Failed to clear data");
    }
  };

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

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Data Management</h2>
            <p className="text-muted-foreground text-sm">
              Manage your local data stored in the application.
            </p>
          </div>
          <div className="border-border rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Clear All Todos</h3>
                <p className="text-muted-foreground text-sm">
                  This will remove all todos. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleClearData}
                loading={clearAllTodos.isPending}
              >
                <TrashIcon className="mr-2 size-4" />
                Clear Data
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
