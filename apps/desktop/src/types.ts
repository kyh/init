import { z } from "zod";

export const IPC_CHANNELS = {
  MENU_ACTION: "desktop:menu-action",
  UPDATE_STATE: "desktop:update-state",
  UPDATE_CHECK: "desktop:update-check",
  UPDATE_DOWNLOAD: "desktop:update-download",
  UPDATE_INSTALL: "desktop:update-install",
} as const;

/** Validate main-process events before exposing them to the renderer. */
export const updateStateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.enum(["idle", "checking", "not-available"]) }),
  z.object({ status: z.literal("available"), version: z.string() }),
  z.object({ status: z.literal("downloading"), downloadPercent: z.number() }),
  z.object({ status: z.literal("downloaded"), version: z.string() }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

export type UpdateState = z.infer<typeof updateStateSchema>;

export type DesktopBridge = {
  onMenuAction: (listener: (action: string) => void) => () => void;
  checkForUpdates: () => Promise<UpdateState>;
  downloadUpdate: () => Promise<UpdateState>;
  installUpdate: () => Promise<UpdateState>;
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
