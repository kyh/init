// Chrome extension storage utilities

export type StorageData = {
  apiBaseUrl: string;
  session: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      image?: string;
    };
    activeOrganizationId?: string;
  } | null;
  activeOrganization: {
    id: string;
    name: string;
    slug: string;
  } | null;
  theme: "light" | "dark" | "system";
};

const DEFAULT_DATA: StorageData = {
  apiBaseUrl: "http://localhost:3000",
  session: null,
  activeOrganization: null,
  theme: "system",
};

export async function getStorageData<K extends keyof StorageData>(
  key: K,
): Promise<StorageData[K]> {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? DEFAULT_DATA[key];
}

export async function setStorageData<K extends keyof StorageData>(
  key: K,
  value: StorageData[K],
): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

export async function getAllStorageData(): Promise<StorageData> {
  const result = await chrome.storage.local.get(null);
  return {
    ...DEFAULT_DATA,
    ...result,
  };
}

export async function clearStorageData(): Promise<void> {
  await chrome.storage.local.clear();
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
