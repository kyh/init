import path from "node:path";

import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import electronUpdater from "electron-updater";

import { IPC_CHANNELS, isHttpUrl, toErrorMessage } from "../types";
import type { UpdateState } from "../types";

const { autoUpdater } = electronUpdater;
declare const __PACKAGED_WEBAPP_URL__: string;

const WEBAPP_DEV_URL = "http://localhost:3000";
const isDevelopment = !app.isPackaged;

const webAppUrl = isDevelopment ? WEBAPP_DEV_URL : __PACKAGED_WEBAPP_URL__;

/** OAuth must navigate inside the window. Keep these origins aligned with configured auth providers. */
const OAUTH_ORIGINS = new Set(["https://github.com"]);

const isAllowedInWindow = (url: string): boolean => {
  try {
    const { origin } = new URL(url);
    return origin === new URL(webAppUrl).origin || OAUTH_ORIGINS.has(origin);
  } catch {
    return false;
  }
};

const STARTUP_UPDATE_DELAY_MS = 15_000;
const APP_DISPLAY_NAME = isDevelopment ? "Init (Dev)" : "Init";

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

let updateState: UpdateState = { status: "idle" };

const setUpdateState = (state: UpdateState): void => {
  updateState = state;
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.UPDATE_STATE, updateState);
    }
  }
};

const configureAppIdentity = (): void => {
  app.setName(APP_DISPLAY_NAME);
  app.setAboutPanelOptions({
    applicationName: APP_DISPLAY_NAME,
    applicationVersion: app.getVersion(),
  });
};

const createWindow = (): BrowserWindow => {
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    height: 800,
    minHeight: 600,
    minWidth: 800,
    show: false,
    title: APP_DISPLAY_NAME,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(import.meta.dirname, "../preload/index.cjs"),
      sandbox: true,
      webSecurity: true,
    },
    width: 1200,
  });

  window.webContents.setWindowOpenHandler((details) => {
    if (isHttpUrl(details.url)) {
      void shell.openExternal(details.url);
    }
    return { action: "deny" };
  });

  // Guard existing-window navigation too: other origins must not inherit desktopBridge.
  const guardNavigation = (event: Electron.Event, url: string) => {
    if (isAllowedInWindow(url)) {
      return;
    }
    event.preventDefault();
    if (isHttpUrl(url)) {
      void shell.openExternal(url);
    }
  };

  window.webContents.on("will-navigate", guardNavigation);
  window.webContents.on("will-redirect", guardNavigation);

  window.on("page-title-updated", (event) => {
    event.preventDefault();
    window.setTitle(APP_DISPLAY_NAME);
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  void window.loadURL(webAppUrl);

  if (isDevelopment) {
    window.webContents.on("before-input-event", (_event, input) => {
      if (input.key === "F12" && input.type === "keyDown") {
        window.webContents.toggleDevTools();
      }
    });
  }

  window.on("closed", () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  return window;
};

const ensureWindow = (): BrowserWindow => {
  const existing =
    BrowserWindow.getFocusedWindow() ?? mainWindow ?? BrowserWindow.getAllWindows()[0];
  if (existing) {
    return existing;
  }
  mainWindow = createWindow();
  return mainWindow;
};

const dispatchMenuAction = (action: string): void => {
  const win = ensureWindow();

  const send = () => {
    if (win.isDestroyed()) {
      return;
    }
    if (!win.isVisible()) {
      win.show();
    }
    win.focus();
    win.webContents.send(IPC_CHANNELS.MENU_ACTION, action);
  };

  if (win.webContents.isLoadingMainFrame()) {
    win.webContents.once("did-finish-load", send);
    return;
  }

  send();
};

const checkForUpdates = async (): Promise<void> => {
  if (isDevelopment) {
    return;
  }

  if (["checking", "downloading", "downloaded"].includes(updateState.status)) {
    return;
  }
  setUpdateState({ status: "checking" });

  try {
    await autoUpdater.checkForUpdates();
  } catch (error: unknown) {
    setUpdateState({ message: toErrorMessage(error), status: "error" });
  }
};

const configureApplicationMenu = (): void => {
  const template: MenuItemConstructorOptions[] = [
    {
      label: app.name,
      submenu: [
        { role: "about" },
        {
          click: () => checkForUpdates(),
          label: "Check for Updates...",
        },
        { type: "separator" },
        {
          accelerator: "CmdOrCtrl+,",
          click: () => dispatchMenuAction("open-settings"),
          label: "Settings...",
        },
        { type: "separator" },
        { role: "services" },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "File",
      submenu: [{ role: "close" }],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

const registerIpcHandlers = (): void => {
  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
    await checkForUpdates();
    return updateState;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
    if (updateState.status !== "available") {
      return updateState;
    }
    try {
      setUpdateState({ downloadPercent: 0, status: "downloading" });
      await autoUpdater.downloadUpdate();
      return updateState;
    } catch (error: unknown) {
      setUpdateState({ message: toErrorMessage(error), status: "error" });
      return updateState;
    }
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, () => {
    if (updateState.status !== "downloaded") {
      return updateState;
    }
    // Defer so the IPC reply reaches the renderer before the process exits.
    setImmediate(() => {
      isQuitting = true;
      try {
        autoUpdater.quitAndInstall();
      } catch (error: unknown) {
        // Reset so the user can retry without restarting the app.
        isQuitting = false;
        setUpdateState({ message: toErrorMessage(error), status: "error" });
      }
    });
    return updateState;
  });
};

const configureAutoUpdater = (): void => {
  if (isDevelopment) {
    return;
  }

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on("update-available", (info) => {
    setUpdateState({ status: "available", version: info.version });
  });

  autoUpdater.on("update-not-available", () => {
    setUpdateState({ status: "not-available" });
  });

  autoUpdater.on("download-progress", (progress) => {
    setUpdateState({
      downloadPercent: Math.floor(progress.percent),
      status: "downloading",
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    setUpdateState({
      status: "downloaded",
      version: info.version,
    });
  });

  autoUpdater.on("error", (error) => {
    setUpdateState({ message: error.message, status: "error" });
  });

  setTimeout(() => checkForUpdates(), STARTUP_UPDATE_DELAY_MS);
};

app.on("before-quit", () => {
  isQuitting = true;
});

const start = async (): Promise<void> => {
  try {
    await app.whenReady();
    configureAppIdentity();
    configureApplicationMenu();
    configureAutoUpdater();
    registerIpcHandlers();

    mainWindow = createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      } else {
        mainWindow?.show();
        mainWindow?.focus();
      }
    });
  } catch (error: unknown) {
    console.error("[desktop] fatal startup error", error);
    dialog.showErrorBox("Init failed to start", toErrorMessage(error));
    app.quit();
  }
};

void start();

const handleSignal = () => {
  if (isQuitting) {
    return;
  }
  isQuitting = true;
  app.quit();
};
process.on("SIGINT", handleSignal);
process.on("SIGTERM", handleSignal);
