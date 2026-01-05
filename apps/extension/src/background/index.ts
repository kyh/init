// Background service worker for the Init Chrome extension

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default values on first install
    chrome.storage.local.set({
      apiBaseUrl: "http://localhost:3000",
      theme: "system",
    });

    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

export {};
