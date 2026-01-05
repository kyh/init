import { useState, useEffect } from "react";
import { Button } from "@repo/ui/button";
import { Input } from "@repo/ui/input";
import { Label } from "@repo/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/select";
import { Save, RefreshCw, ExternalLink } from "lucide-react";

import {
  getStorageData,
  setStorageData,
  type StorageData,
} from "@/lib/storage";

function App() {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [theme, setTheme] = useState<StorageData["theme"]>("system");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      try {
        const [savedApiBaseUrl, savedTheme] = await Promise.all([
          getStorageData("apiBaseUrl"),
          getStorageData("theme"),
        ]);
        setApiBaseUrl(savedApiBaseUrl);
        setTheme(savedTheme);
      } catch {
        setMessage({
          type: "error",
          text: "Failed to load settings",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Validate URL
      const url = new URL(apiBaseUrl);
      const normalizedUrl = url.origin;

      await Promise.all([
        setStorageData("apiBaseUrl", normalizedUrl),
        setStorageData("theme", theme),
      ]);

      setApiBaseUrl(normalizedUrl);
      setMessage({
        type: "success",
        text: "Settings saved successfully",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const openWebApp = () => {
    chrome.tabs.create({ url: apiBaseUrl });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Init Extension Settings</h1>
          <p className="text-muted-foreground">
            Configure your extension settings below.
          </p>
        </div>

        <div className="space-y-6">
          {/* API Base URL */}
          <div className="space-y-2">
            <Label htmlFor="apiBaseUrl">API Base URL</Label>
            <Input
              id="apiBaseUrl"
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
            <p className="text-xs text-muted-foreground">
              The URL of your Init application. Use http://localhost:3000 for
              local development.
            </p>
          </div>

          {/* Theme */}
          <div className="space-y-2">
            <Label htmlFor="theme">Theme</Label>
            <Select
              value={theme}
              onValueChange={(value) =>
                setTheme(value as StorageData["theme"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme.
            </p>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSave} loading={isSaving}>
              <Save className="size-4" />
              Save Settings
            </Button>
            <Button variant="outline" onClick={openWebApp}>
              <ExternalLink className="size-4" />
              Open Web App
            </Button>
          </div>
        </div>

        {/* Help section */}
        <div className="mt-12 rounded-lg border p-4">
          <h2 className="font-semibold">Need help?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Make sure your Init application is running and accessible at the API
            Base URL. If you're using the extension with a deployed version,
            update the URL to your production domain.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
