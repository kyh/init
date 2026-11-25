import { existsSync } from "node:fs";
import path from "node:path";

import { app, dialog, ipcMain } from "electron";
import type { IpcMainInvokeEvent, BrowserWindow } from "electron";

import { channelOf, COMMANDS } from "../shared/bridge";
import type { BridgeEvent, Command, EventPayloads, UpdateState } from "../shared/bridge";
import { installMenu } from "./menu";
import { allowedOrigins } from "./navigation";
import { createUpdater } from "./updater";
import { createMainWindow, pinNavigation, showWindow } from "./window";

declare const __PACKAGED_WEBAPP_URL__: string;

const APP_NAME = "Init";
const DEV_WEBAPP_URL = "http://localhost:3000";
const EMULATOR_URL_VAR = "NEXT_PUBLIC_GITHUB_EMULATOR_URL";
const OPEN_SETTINGS = "open-settings";

const development = !app.isPackaged;
const appUrl = development ? DEV_WEBAPP_URL : __PACKAGED_WEBAPP_URL__;
const appOrigin = new URL(appUrl).origin;
const allowed = allowedOrigins(appUrl, development ? process.env[EMULATOR_URL_VAR] : undefined);

let mainWindow: BrowserWindow | null = null;

const showsApp = (window: BrowserWindow) => {
  try {
    return new URL(window.webContents.getURL()).origin === appOrigin;
  } catch {
    return false;
  }
};

const send = <E extends BridgeEvent>(event: E, payload: EventPayloads[E]) => {
  if (mainWindow && !mainWindow.isDestroyed() && showsApp(mainWindow)) {
    mainWindow.webContents.send(channelOf(event), payload);
  }
};

const isFromApp = (event: IpcMainInvokeEvent) => {
  const frame = event.senderFrame;

  return (
    frame !== null &&
    frame.parent === null &&
    frame.origin === appOrigin &&
    mainWindow !== null &&
    event.sender === mainWindow.webContents
  );
};

const updater = createUpdater(
  app.isPackaged && existsSync(path.join(process.resourcesPath, "app-update.yml")),
  (state: UpdateState) => {
    send("update-state", state);
  },
);

const answers = {
  "check-for-updates": updater.check,
  "download-update": updater.download,
  "install-update": updater.install,
} satisfies Record<Command, () => Promise<UpdateState> | UpdateState>;

const openSettings = () => {
  const window = mainWindow;

  if (!window || window.isDestroyed()) {
    return;
  }

  showWindow(window);

  if (window.webContents.isLoadingMainFrame()) {
    window.webContents.once("did-finish-load", () => {
      send("menu-action", OPEN_SETTINGS);
    });

    return;
  }

  send("menu-action", OPEN_SETTINGS);
};

const start = async () => {
  app.enableSandbox();
  app.setName(APP_NAME);
  pinNavigation(allowed);
  await app.whenReady();

  for (const command of COMMANDS) {
    ipcMain.handle(channelOf(command), async (event) => {
      if (!isFromApp(event)) {
        throw new Error(`${command} is answered only for the web app`);
      }

      return await answers[command]();
    });
  }

  installMenu({
    development,
    onCheckForUpdates: updater.enabled
      ? () => {
          void updater.check();
        }
      : null,
    onOpenSettings: openSettings,
  });

  mainWindow = createMainWindow({ appUrl, development, title: APP_NAME });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

const run = async () => {
  try {
    await start();
  } catch (error: unknown) {
    console.error("[desktop] Init failed to start", error);
    dialog.showErrorBox(`${APP_NAME} failed to start`, String(error));
    app.exit(1);
  }
};

void run();

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    app.quit();
  });
}
