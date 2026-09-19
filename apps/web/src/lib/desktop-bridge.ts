/** Mirrors apps/desktop/src/types.ts without coupling the web build to Electron. Keep the IPC contract in sync. */

export type DesktopUpdateState =
  | { status: "idle" | "checking" | "not-available" }
  | { status: "available"; version: string }
  | { status: "downloading"; downloadPercent: number }
  | { status: "downloaded"; version: string }
  | { status: "error"; message: string };

export interface DesktopBridge {
  onMenuAction: (listener: (action: string) => void) => () => void;
  checkForUpdates: () => Promise<DesktopUpdateState>;
  downloadUpdate: () => Promise<DesktopUpdateState>;
  installUpdate: () => Promise<DesktopUpdateState>;
  onUpdateState: (listener: (state: DesktopUpdateState) => void) => () => void;
}

declare global {
  interface Window {
    /** Present only inside the Electron shell (apps/desktop/src/preload). */
    desktopBridge?: DesktopBridge;
  }
}
