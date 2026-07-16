export default defineBackground(() => {
  browser.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
      void browser.runtime.openOptionsPage();
    }
  });
});
