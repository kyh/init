import { z } from "zod";

export const IPC_CHANNELS = {
  PICK_FOLDER: "desktop:pick-folder",
  CONFIRM: "desktop:confirm",
  OPEN_EXTERNAL: "desktop:open-external",
  MENU_ACTION: "desktop:menu-action",
  UPDATE_STATE: "desktop:update-state",
  UPDATE_CHECK: "desktop:update-check",
  UPDATE_DOWNLOAD: "desktop:update-download",
  UPDATE_INSTALL: "desktop:update-install",
} as const;

/** Parses IPC payloads in the sandboxed preload, where the renderer is
 *  untrusted; the values themselves always originate from the main process. */
export const updateStateSchema = z.object({
  status: z.enum([
    "idle",
    "checking",
    "available",
    "not-available",
    "downloading",
    "downloaded",
    "error",
  ]),
  version: z.string().nullable(),
  downloadPercent: z.number().nullable(),
  message: z.string().nullable(),
});

export type UpdateState = z.infer<typeof updateStateSchema>;

export type UpdateResponse = {
  accepted: boolean;
  state: UpdateState;
};

export type DesktopBridge = {
  pickFolder: () => Promise<string | null>;
  confirm: (message: string) => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  onMenuAction: (listener: (action: string) => void) => () => void;
  checkForUpdates: () => Promise<UpdateState>;
  downloadUpdate: () => Promise<UpdateResponse>;
  installUpdate: () => Promise<UpdateResponse>;
  onUpdateState: (listener: (state: UpdateState) => void) => () => void;
};

export function toErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}
