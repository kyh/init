// Background service worker for the Init Chrome extension

export default defineBackground(() => {
  // Listen for installation
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      // Set default values on first install
      void browser.storage.local.set({
        apiBaseUrl: "http://localhost:3000",
        theme: "system",
      });

      // Open options page on first install
      void browser.runtime.openOptionsPage();
    }
  });
});
