import { invoke, isTauri } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { z } from "zod";

const updateStateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.enum(["idle", "checking", "not-available"]) }),
  z.object({ status: z.literal("available"), version: z.string() }),
  z.object({ downloadPercent: z.number(), status: z.literal("downloading") }),
  z.object({ status: z.literal("downloaded"), version: z.string() }),
  z.object({ message: z.string(), status: z.literal("error") }),
]);

export type DesktopUpdateState = z.infer<typeof updateStateSchema>;

interface DesktopBridge {
  onMenuAction: (listener: (action: string) => void) => () => void;
  checkForUpdates: () => Promise<DesktopUpdateState>;
  downloadUpdate: () => Promise<DesktopUpdateState>;
  installUpdate: () => Promise<DesktopUpdateState>;
  onUpdateState: (listener: (state: DesktopUpdateState) => void) => () => void;
}

const register = async <T>(event: string, schema: z.ZodType<T>, listener: (value: T) => void) => {
  try {
    return await listen<unknown>(event, ({ payload }) => {
      const parsed = schema.safeParse(payload);

      if (parsed.success) {
        listener(parsed.data);
      }
    });
  } catch {
    return null;
  }
};

const detach = async (registration: Promise<UnlistenFn | null>) => {
  const stop = await registration;
  stop?.();
};

const subscribe = <T>(event: string, schema: z.ZodType<T>, listener: (value: T) => void) => {
  const registration = register(event, schema, listener);

  return () => {
    void detach(registration);
  };
};

const ask = async (command: string) => updateStateSchema.parse(await invoke<unknown>(command));

const tauriBridge: DesktopBridge = {
  checkForUpdates: async () => await ask("check_for_updates"),
  downloadUpdate: async () => await ask("download_update"),
  installUpdate: async () => await ask("install_update"),
  onMenuAction: (listener) => subscribe("menu-action", z.string(), listener),
  onUpdateState: (listener) => subscribe("update-state", updateStateSchema, listener),
};

/** The desktop shell (apps/desktop), or null in a browser tab. */
export const desktopBridge = () => (isTauri() ? tauriBridge : null);
