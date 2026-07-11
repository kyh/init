export default defineBackground(() => {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      void browser.storage.local.set({
        apiBaseUrl: "http://localhost:3000",
        theme: "system",
      });

      void browser.runtime.openOptionsPage();
    }
  });
});
