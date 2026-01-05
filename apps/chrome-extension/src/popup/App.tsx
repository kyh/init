import { useEffect, useState } from "react";
import { Settings, RefreshCw } from "lucide-react";

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

    loadUrl();

    // Listen for URL changes from options page
    const unsubscribe = onStorageChange((changes) => {
      if (changes.apiBaseUrl?.newValue) {
        setAppUrl(changes.apiBaseUrl.newValue);
      }
    });

    return unsubscribe;
  }, []);

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  if (isLoading) {
    return (
      <div className="bg-background flex h-[600px] w-[400px] items-center justify-center">
        <RefreshCw className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-background flex h-[600px] w-[400px] flex-col">
      {/* Settings button - floating in corner */}
      <button
        onClick={openOptions}
        className="bg-background/80 text-muted-foreground hover:bg-accent hover:text-foreground absolute top-2 right-2 z-10 rounded-md p-1.5 backdrop-blur-sm transition-colors"
        title="Settings"
      >
        <Settings className="size-4" />
      </button>

      {/* Iframe loading the Next.js app */}
      <iframe
        src={appUrl || "http://localhost:3000"}
        className="h-full w-full border-0"
        title="Init App"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
};

export default App;
