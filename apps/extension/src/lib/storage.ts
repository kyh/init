// Chrome extension storage utilities

export type StorageData = {
  apiBaseUrl: string;
  theme: "light" | "dark" | "system";
};

const DEFAULT_DATA: StorageData = {
  apiBaseUrl: "http://localhost:3000",
  theme: "system",
};

export async function getStorageData<K extends keyof StorageData>(
  key: K,
): Promise<StorageData[K]> {
  const result = await chrome.storage.local.get(key);
  return (result[key] as StorageData[K]) ?? DEFAULT_DATA[key];
}

export async function setStorageData<K extends keyof StorageData>(
  key: K,
  value: StorageData[K],
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// Listen for storage changes
export function onStorageChange(
  callback: (changes: {
    [key in keyof StorageData]?: {
      oldValue?: StorageData[key];
      newValue?: StorageData[key];
    };
  }) => void,
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName === "local") {
      callback(changes as Parameters<typeof callback>[0]);
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
