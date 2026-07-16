/**
 * Mirrors the subset of `DesktopBridge` (apps/desktop/src/types.ts) that
 * apps/web actually consumes. Duplicated rather than imported: no app in
 * this monorepo depends on another app's package, and apps/web must stay
 * buildable/deployable (e.g. to Vercel) without pulling in the Electron
 * toolchain. Keep in sync by hand if the preload's surface changes.
 */

export type DesktopUpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "not-available"
  | "downloading"
  | "downloaded"
  | "error";

export type DesktopUpdateState = {
  status: DesktopUpdateStatus;
  version: string | null;
  downloadPercent: number | null;
  message: string | null;
};

export type DesktopUpdateResponse = {
  accepted: boolean;
  state: DesktopUpdateState;
};

export type DesktopBridge = {
  onMenuAction: (listener: (action: string) => void) => () => void;
  checkForUpdates: () => Promise<DesktopUpdateState>;
  downloadUpdate: () => Promise<DesktopUpdateResponse>;
  installUpdate: () => Promise<DesktopUpdateResponse>;
  onUpdateState: (listener: (state: DesktopUpdateState) => void) => () => void;
};

declare global {
  interface Window {
    /** Present only inside the Electron shell (apps/desktop/src/preload). */
    desktopBridge?: DesktopBridge;
  }
}
