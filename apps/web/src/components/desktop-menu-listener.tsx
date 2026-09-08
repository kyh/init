"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const DesktopMenuListener = () => {
  const router = useRouter();

  useEffect(() => {
    const { desktopBridge } = window;
    if (!desktopBridge) {
      return;
    }

    return desktopBridge.onMenuAction((action) => {
      if (action === "open-settings") {
        router.push("/dashboard/account");
      }
    });
  }, [router]);

  return null;
};
