// Browser extension storage utilities

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
  const result = await browser.storage.local.get(key);
  const value = result[key] as StorageData[K] | undefined;
  return value ?? DEFAULT_DATA[key];
}

export async function setStorageData<K extends keyof StorageData>(
  key: K,
  value: StorageData[K],
): Promise<void> {
  await browser.storage.local.set({ [key]: value });
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
    changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
    areaName: string,
  ) => {
    if (areaName === "local") {
      callback(changes as Parameters<typeof callback>[0]);
    }
  };

  browser.storage.onChanged.addListener(listener);
  return () => browser.storage.onChanged.removeListener(listener);
}
