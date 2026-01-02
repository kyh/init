// Background service worker for the Init Chrome extension

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    // Set default values on first install
    chrome.storage.local.set({
      apiBaseUrl: "http://localhost:3000",
      theme: "system",
      session: null,
      activeOrganization: null,
    });

    // Open options page on first install
    chrome.runtime.openOptionsPage();
  }
});

// Listen for messages from popup or options page
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_STORAGE") {
    chrome.storage.local.get(message.keys).then(sendResponse);
    return true; // Keep channel open for async response
  }

  if (message.type === "SET_STORAGE") {
    chrome.storage.local.set(message.data).then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "CLEAR_STORAGE") {
    chrome.storage.local.clear().then(() => sendResponse({ success: true }));
    return true;
  }

  if (message.type === "OPEN_TAB") {
    chrome.tabs.create({ url: message.url }).then(sendResponse);
    return true;
  }

  return false;
});

// Handle extension icon click (if popup is disabled)
chrome.action.onClicked.addListener((_tab) => {
  // This won't fire if default_popup is set, but keeping it for flexibility
  chrome.runtime.openOptionsPage();
});

// Export empty object for module compatibility
export {};
