import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Spinner } from "@repo/ui/components/spinner";
import { Settings } from "lucide-react";

import { getStorageData, onStorageChange } from "@/lib/storage";

const App = () => {
  const [appUrl, setAppUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUrl = async () => {
      const url = await getStorageData("apiBaseUrl");
      setAppUrl(url);
      setIsLoading(false);
    };

    void loadUrl();

    // Listen for URL changes from options page
    const unsubscribe = onStorageChange((changes) => {
      if (changes.apiBaseUrl?.newValue) {
        setAppUrl(changes.apiBaseUrl.newValue);
      }
    });

    return unsubscribe;
  }, []);

  const openOptions = () => {
    void browser.runtime.openOptionsPage();
  };

  if (isLoading) {
    return (
      <div className="bg-background flex h-[600px] w-[400px] items-center justify-center">
        <Spinner className="text-muted-foreground size-6" />
      </div>
    );
  }

  return (
    <div className="bg-background flex h-[600px] w-[400px] flex-col">
      <Button
        variant="ghost"
        size="icon"
        onClick={openOptions}
        className="absolute top-2 right-2 z-10 size-8 backdrop-blur-sm"
        title="Settings"
      >
        <Settings className="size-4" />
      </Button>

      <iframe
        src={appUrl ?? "http://localhost:3000"}
        className="h-full w-full border-0"
        title="Init App"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};

export default App;
