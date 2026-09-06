"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** False during SSR/hydration, true afterwards. Use for values unavailable on the server. */
export const useIsHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
