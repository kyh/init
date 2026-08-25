import { useEffect, useState } from "react";
import { Button } from "@repo/ui/components/button";
import { Logo } from "@repo/ui/components/logo";
import { Spinner } from "@repo/ui/components/spinner";
import { ExternalLink, Settings } from "lucide-react";

import { apiBaseUrlItem } from "@/lib/storage";

const openOptions = () => {
  void browser.runtime.openOptionsPage();
};

const App = () => {
  // The item's fallback means getValue never resolves null, so null is exactly
  // "first read still in flight" — no separate loading flag can disagree with it.
  const [appUrl, setAppUrl] = useState<string | null>(null);

  useEffect(() => {
    void apiBaseUrlItem.getValue().then(setAppUrl);

    // The options page can change the URL while the popup is open
    return apiBaseUrlItem.watch(setAppUrl);
  }, []);

  const openApp = () => {
    if (appUrl === null) return;
    void browser.tabs.create({ url: appUrl });
    // The popup would otherwise linger over the tab it just opened
    window.close();
  };

  if (appUrl === null) {
    return (
      <div className="bg-background flex h-[228px] w-[320px] items-center justify-center">
        <Spinner className="text-muted-foreground size-5" />
      </div>
    );
  }

  return (
    <div className="bg-background flex h-[228px] w-[320px] flex-col justify-between p-4">
      <div className="flex items-start justify-between">
        <Logo className="size-7" />
        <Button variant="ghost" size="icon-sm" onClick={openOptions} title="Settings">
          <Settings />
        </Button>
      </div>

      <div className="space-y-1">
        <h1 className="font-semibold">Init</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Your AI-native starter kit for building, launching, and scaling applications.
        </p>
      </div>

      <div className="space-y-2">
        <Button className="w-full" onClick={openApp}>
          <ExternalLink />
          Open Init
        </Button>
        <p className="text-muted-foreground truncate text-center text-xs">{appUrl}</p>
      </div>
    </div>
  );
};

export default App;
