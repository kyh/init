export const IPC_CHANNELS = {
  PICK_FOLDER: "desktop:pick-folder",
  CONFIRM: "desktop:confirm",
  OPEN_EXTERNAL: "desktop:open-external",
  MENU_ACTION: "desktop:menu-action",
} as const;

export type DesktopBridge = {
  pickFolder: () => Promise<string | null>;
  confirm: (message: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  onMenuAction: (listener: (action: string) => void) => () => void;
};

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
