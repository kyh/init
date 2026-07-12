import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Spinner } from "@repo/ui/components/spinner";
import { Settings } from "lucide-react";

import { getStorageData, onStorageChange } from "@/lib/storage";

const openOptions = () => {
  void browser.runtime.openOptionsPage();
};

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

    // The options page can change the URL while the popup is open
    const unsubscribe = onStorageChange((changes) => {
      if (changes.apiBaseUrl?.newValue) {
        setAppUrl(changes.apiBaseUrl.newValue);
      }
    });

    return unsubscribe;
  }, []);

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

      {/* Embeds our own app: it needs scripts + same-origin cookies for auth, so the
          sandbox can't isolate it — but it still blocks top-navigation hijacks */}
      {/* oxlint-disable iframe-missing-sandbox, react-doctor/iframe-missing-sandbox -- extension parent and web child are cross-origin */}
      <iframe
        src={appUrl ?? "http://localhost:3000"}
        className="h-full w-full border-0"
        title="Init App"
        allow="clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      {/* oxlint-enable iframe-missing-sandbox, react-doctor/iframe-missing-sandbox */}
    </div>
  );
};

export default App;
