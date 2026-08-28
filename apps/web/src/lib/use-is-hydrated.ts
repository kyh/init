"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False through SSR and the hydration render, true afterwards. For markup a
 * server can't produce — client-only randomness, values that resolve after
 * mount — so the first client render still matches the server's HTML.
 *
 * useSyncExternalStore rather than the setState-in-an-effect mount flag: React
 * reads the server snapshot while hydrating and the client one after, without
 * a second render pass scheduled from an effect.
 */
export const useIsHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
