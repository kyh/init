"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Routes the Electron app menu's "Settings…" action (Cmd+,, see
 * apps/desktop/src/main/index.ts) to the web app's settings page. Inert
 * outside the desktop shell — `window.desktopBridge` only exists once the
 * preload script (apps/desktop/src/preload) has run.
 */
export function DesktopMenuListener() {
  const router = useRouter();

  useEffect(() => {
    const { desktopBridge } = window;
    if (typeof desktopBridge === "undefined") return;

    return desktopBridge.onMenuAction((action) => {
      if (action === "open-settings") {
        router.push("/dashboard/account");
      }
    });
  }, [router]);

  return null;
}
