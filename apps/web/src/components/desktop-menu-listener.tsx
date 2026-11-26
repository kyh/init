"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { desktopBridge } from "@/lib/desktop-bridge";

export const DesktopMenuListener = () => {
  const router = useRouter();

  useEffect(
    () =>
      desktopBridge()?.onMenuAction((action) => {
        if (action === "open-settings") {
          router.push("/dashboard/account");
        }
      }),
    [router],
  );

  return null;
};
