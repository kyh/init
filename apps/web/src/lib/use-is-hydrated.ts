"use client";

import { useSyncExternalStore } from "react";

const unsubscribe = () => null;

const subscribe = () => unsubscribe;

/** False during SSR/hydration, true afterwards. Use for values unavailable on the server. */
export const useIsHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
