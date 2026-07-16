/**
 * `fallback` is returned whenever storage holds no value, so nothing needs to
 * seed this on install and no consumer needs a default of its own.
 */
export const apiBaseUrlItem = storage.defineItem<string>("local:apiBaseUrl", {
  fallback: "http://localhost:3000",
});
