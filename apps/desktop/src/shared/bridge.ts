/** The commands the web app may invoke (`apps/web/src/lib/desktop-bridge.ts`). */
export const COMMANDS = ["check-for-updates", "download-update", "install-update"] as const;

export type Command = (typeof COMMANDS)[number];

export type BridgeEvent = keyof EventPayloads;

/** Hands the preload the web app's origin, the only one it exposes the bridge to. */
export const APP_ORIGIN_ARG = "--desktop-app-origin=";

export const channelOf = (name: Command | BridgeEvent) => `desktop:${name}`;

/** Mirrored by `updateStateSchema` in `apps/web/src/lib/desktop-bridge.ts`, which parses it. */
export type UpdateState =
  | { status: "idle" | "checking" | "not-available" }
  | { status: "available"; version: string }
  | { downloadPercent: number; status: "downloading" }
  | { status: "downloaded"; version: string }
  | { message: string; status: "error" };

/** What each event carries. */
export interface EventPayloads {
  "menu-action": string;
  "update-state": UpdateState;
}
