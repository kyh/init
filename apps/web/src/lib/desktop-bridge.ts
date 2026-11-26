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

interface NativeBridge {
  // oxlint-disable-next-line anti-slop/no-unknown-returns -- the preload's answers arrive unparsed; bridgeOf parses each one
  checkForUpdates: () => Promise<unknown>;
  // oxlint-disable-next-line anti-slop/no-unknown-returns -- as above
  downloadUpdate: () => Promise<unknown>;
  // oxlint-disable-next-line anti-slop/no-unknown-returns -- as above
  installUpdate: () => Promise<unknown>;
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- the preload's events arrive unparsed; bridgeOf parses each one
  onMenuAction: (listener: (action: unknown) => void) => () => void;
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- as above
  onUpdateState: (listener: (state: unknown) => void) => () => void;
}

declare global {
  interface Window {
    desktopBridge?: unknown;
  }
}

const isNativeBridge = (value: unknown): value is NativeBridge =>
  typeof value === "object" &&
  value !== null &&
  "checkForUpdates" in value &&
  typeof value.checkForUpdates === "function" &&
  "downloadUpdate" in value &&
  typeof value.downloadUpdate === "function" &&
  "installUpdate" in value &&
  typeof value.installUpdate === "function" &&
  "onMenuAction" in value &&
  typeof value.onMenuAction === "function" &&
  "onUpdateState" in value &&
  typeof value.onUpdateState === "function";

const parsedBy =
  <T>(schema: z.ZodType<T>, listener: (value: T) => void) =>
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- a preload event arrives unparsed, and this is where it is parsed
  (payload: unknown) => {
    const parsed = schema.safeParse(payload);

    if (parsed.success) {
      listener(parsed.data);
    }
  };

const bridgeOf = (native: NativeBridge) =>
  ({
    checkForUpdates: async () => updateStateSchema.parse(await native.checkForUpdates()),
    downloadUpdate: async () => updateStateSchema.parse(await native.downloadUpdate()),
    installUpdate: async () => updateStateSchema.parse(await native.installUpdate()),
    onMenuAction: (listener) => native.onMenuAction(parsedBy(z.string(), listener)),
    onUpdateState: (listener) => native.onUpdateState(parsedBy(updateStateSchema, listener)),
  }) satisfies DesktopBridge;

/** The desktop shell (apps/desktop, its preload's `desktopBridge`), or null in a browser tab. */
export const desktopBridge = () => {
  const native = typeof window === "undefined" ? undefined : window.desktopBridge;

  return isNativeBridge(native) ? bridgeOf(native) : null;
};
