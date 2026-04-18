import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { Spinner } from "@repo/ui/components/spinner";
import { Save, ExternalLink } from "lucide-react";

import { getStorageData, setStorageData } from "@/lib/storage";

const App = () => {
  const [apiBaseUrl, setApiBaseUrl] = useState("");
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
        const savedApiBaseUrl = await getStorageData("apiBaseUrl");
        setApiBaseUrl(savedApiBaseUrl);
      } catch {
        setMessage({
          type: "error",
          text: "Failed to load settings",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // Validate URL
      const url = new URL(apiBaseUrl);
      const normalizedUrl = url.origin;

      await setStorageData("apiBaseUrl", normalizedUrl);

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
    void browser.tabs.create({ url: apiBaseUrl });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-muted-foreground size-6" />
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen p-8">
      <div className="mx-auto max-w-lg">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Init Extension Settings</h1>
          <p className="text-muted-foreground">Configure the URL of your Init application.</p>
        </div>

        <div className="space-y-6">
          {/* API Base URL */}
          <div className="space-y-2">
            <Label htmlFor="apiBaseUrl">Application URL</Label>
            <Input
              id="apiBaseUrl"
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="http://localhost:3000"
            />
            <p className="text-muted-foreground text-xs">
              The URL of your Init application. Use http://localhost:3000 for local development or
              your production URL for deployed apps.
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
              Open in Tab
            </Button>
          </div>
        </div>

        {/* Help section */}
        <div className="mt-12 rounded-lg border p-4">
          <h2 className="font-semibold">How it works</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            The extension popup displays your Init application in an iframe. Make sure your
            application is running at the configured URL. Authentication and all features work the
            same as in the browser.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
