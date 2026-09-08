import { z } from "zod";

export const IPC_CHANNELS = {
  MENU_ACTION: "desktop:menu-action",
  UPDATE_CHECK: "desktop:update-check",
  UPDATE_DOWNLOAD: "desktop:update-download",
  UPDATE_INSTALL: "desktop:update-install",
  UPDATE_STATE: "desktop:update-state",
} as const;

/** Validate main-process events before exposing them to the renderer. */
export const updateStateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.enum(["idle", "checking", "not-available"]) }),
  z.object({ status: z.literal("available"), version: z.string() }),
  z.object({ downloadPercent: z.number(), status: z.literal("downloading") }),
  z.object({ status: z.literal("downloaded"), version: z.string() }),
  z.object({ message: z.string(), status: z.literal("error") }),
]);

export type UpdateState = z.infer<typeof updateStateSchema>;

export interface DesktopBridge {
  onMenuAction: (listener: (action: string) => void) => () => void;
  checkForUpdates: () => Promise<UpdateState>;
  downloadUpdate: () => Promise<UpdateState>;
  installUpdate: () => Promise<UpdateState>;
  onUpdateState: (listener: (state: UpdateState) => void) => () => void;
}

export const toErrorMessage = (cause: unknown): string =>
  cause instanceof Error ? cause.message : String(cause);

export const isHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
};
