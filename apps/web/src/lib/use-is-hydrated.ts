"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {
  /* empty */
};

/** False during SSR/hydration, true afterwards. Use for values unavailable on the server. */
export const useIsHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
