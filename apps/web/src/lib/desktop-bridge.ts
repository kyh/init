import { z } from "zod";

const updateStateSchema = z.discriminatedUnion("status", [
  z.object({ status: z.enum(["idle", "checking", "not-available"]) }),
  z.object({ status: z.literal("available"), version: z.string() }),
  z.object({ downloadPercent: z.number(), status: z.literal("downloading") }),
  z.object({ status: z.literal("downloaded"), version: z.string() }),
  z.object({ message: z.string(), status: z.literal("error") }),
]);

export type DesktopUpdateState = z.infer<typeof updateStateSchema>;

export interface DesktopBridge {
  onMenuAction: (listener: (action: string) => void) => () => void;
  checkForUpdates: () => Promise<DesktopUpdateState>;
  downloadUpdate: () => Promise<DesktopUpdateState>;
  installUpdate: () => Promise<DesktopUpdateState>;
  onUpdateState: (listener: (state: DesktopUpdateState) => void) => () => void;
}

interface NativeBridge {
  // oxlint-disable-next-line anti-slop/no-unknown-returns -- the preload's answers arrive unparsed; bridgeOf parses each one
  invoke: (command: string) => Promise<unknown>;
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- the preload's events arrive unparsed; bridgeOf parses each one
  on: (event: string, listener: (payload: unknown) => void) => () => void;
}

declare global {
  interface Window {
    desktopBridge?: unknown;
  }
}

const isNativeBridge = (value: unknown): value is NativeBridge =>
  typeof value === "object" &&
  value !== null &&
  "invoke" in value &&
  typeof value.invoke === "function" &&
  "on" in value &&
  typeof value.on === "function";

const bridgeOf = (native: NativeBridge) => {
  const subscribe = <T>(event: string, schema: z.ZodType<T>, listener: (value: T) => void) =>
    native.on(event, (payload) => {
      const parsed = schema.safeParse(payload);

      if (parsed.success) {
        listener(parsed.data);
      }
    });

  const ask = async (command: string) => updateStateSchema.parse(await native.invoke(command));

  return {
    checkForUpdates: async () => await ask("check-for-updates"),
    downloadUpdate: async () => await ask("download-update"),
    installUpdate: async () => await ask("install-update"),
    onMenuAction: (listener) => subscribe("menu-action", z.string(), listener),
    onUpdateState: (listener) => subscribe("update-state", updateStateSchema, listener),
  } satisfies DesktopBridge;
};

/** The desktop shell (apps/desktop, its preload's `desktopBridge`), or null in a browser tab. */
export const desktopBridge = () => {
  const native = typeof window === "undefined" ? undefined : window.desktopBridge;

  return isNativeBridge(native) ? bridgeOf(native) : null;
};
