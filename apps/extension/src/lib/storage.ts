export const apiBaseUrlItem = storage.defineItem<string>("local:apiBaseUrl", {
  fallback: "http://localhost:3000",
});
