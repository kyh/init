import * as fs from "node:fs";
import * as Path from "node:path";

import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  shell,
} from "electron";
import type { MenuItemConstructorOptions } from "electron";
import { autoUpdater } from "electron-updater";

import {
  IPC_CHANNELS,
  isHttpUrl,
  toErrorMessage,
} from "../types";
import type { UpdateState } from "../types";

const WEBAPP_DEV_URL = "http://localhost:3000";
const isDevelopment = !app.isPackaged;

function getWebAppUrl(): string {
  if (isDevelopment) return WEBAPP_DEV_URL;
  const url = process.env["WEBAPP_URL"];
  if (!url) {
    console.warn(
      "[desktop] WEBAPP_URL is not set in a packaged build, falling back to localhost:3000",
    );
    return WEBAPP_DEV_URL;
  }
  return url;
}
const APP_DISPLAY_NAME = isDevelopment ? "Init (Dev)" : "Init";
const APP_USER_MODEL_ID = "com.init.electron";

let mainWindow: BrowserWindow | null = null;
let isQuitting = false;

// ---------------------------------------------------------------------------
// Auto-updater state
// ---------------------------------------------------------------------------

let updateState: UpdateState = {
  status: "idle",
  version: null,
  downloadPercent: null,
  message: null,
};

function setUpdateState(patch: Partial<UpdateState>): void {
  updateState = { ...updateState, ...patch };
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.UPDATE_STATE, updateState);
    }
  }
}

// ---------------------------------------------------------------------------
// App identity
// ---------------------------------------------------------------------------

function configureAppIdentity(): void {
  app.setName(APP_DISPLAY_NAME);
  app.setAboutPanelOptions({
    applicationName: APP_DISPLAY_NAME,
    applicationVersion: app.getVersion(),
  });

  if (process.platform === "win32") {
    app.setAppUserModelId(APP_USER_MODEL_ID);
  }
}

// ---------------------------------------------------------------------------
// Application menu
// ---------------------------------------------------------------------------

function dispatchMenuAction(action: string): void {
  const existingWindow =
    BrowserWindow.getFocusedWindow() ??
    mainWindow ??
    BrowserWindow.getAllWindows()[0];
  const targetWindow = existingWindow ?? createWindow();
  if (!existingWindow) {
    mainWindow = targetWindow;
  }

  const send = () => {
    if (targetWindow.isDestroyed()) return;
    targetWindow.webContents.send(IPC_CHANNELS.MENU_ACTION, action);
    if (!targetWindow.isVisible()) {
      targetWindow.show();
    }
    targetWindow.focus();
  };

  if (targetWindow.webContents.isLoadingMainFrame()) {
    targetWindow.webContents.once("did-finish-load", send);
    return;
  }

  send();
}

function configureApplicationMenu(): void {
  const template: MenuItemConstructorOptions[] = [];

  if (process.platform === "darwin") {
    template.push({
      label: app.name,
      submenu: [
        { role: "about" },
        {
          label: "Check for Updates...",
          click: () => void checkForUpdates(),
        },
        { type: "separator" },
        {
          label: "Settings...",
          accelerator: "CmdOrCtrl+,",
          click: () => dispatchMenuAction("open-settings"),
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
    });
  }

  template.push(
    {
      label: "File",
      submenu: [
        ...(process.platform === "darwin"
          ? []
          : [
              {
                label: "Settings...",
                accelerator: "CmdOrCtrl+,",
                click: () => dispatchMenuAction("open-settings"),
              },
              { type: "separator" as const },
            ]),
        {
          role: process.platform === "darwin" ? ("close" as const) : ("quit" as const),
        },
      ],
    },
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "Check for Updates...",
          click: () => void checkForUpdates(),
        },
      ],
    },
  );

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// Icon resolution
// ---------------------------------------------------------------------------

function resolveIconPath(ext: "ico" | "icns" | "png"): string | null {
  const candidates = [
    Path.join(__dirname, "../../resources", `icon.${ext}`),
    Path.join(process.resourcesPath, "resources", `icon.${ext}`),
    Path.join(process.resourcesPath, `icon.${ext}`),
  ];

  for (const candidate of candidates) {
    try {
      fs.accessSync(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  return null;
}

let cachedIconOption: { icon: string } | Record<string, never> | null =
  null;

function getIconOption(): { icon: string } | Record<string, never> {
  if (cachedIconOption) return cachedIconOption;
  if (process.platform === "darwin") {
    cachedIconOption = {};
  } else {
    const ext = process.platform === "win32" ? "ico" : "png";
    const iconPath = resolveIconPath(ext);
    cachedIconOption = iconPath ? { icon: iconPath } : {};
  }
  return cachedIconOption;
}

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

function registerIpcHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.PICK_FOLDER, async () => {
    const owner = BrowserWindow.getFocusedWindow() ?? mainWindow;
    const result = owner
      ? await dialog.showOpenDialog(owner, {
          properties: ["openDirectory", "createDirectory"],
        })
      : await dialog.showOpenDialog({
          properties: ["openDirectory", "createDirectory"],
        });
    if (result.canceled) return null;
    return result.filePaths[0] ?? null;
  });

  ipcMain.handle(
    IPC_CHANNELS.CONFIRM,
    async (_event, message: unknown) => {
      if (typeof message !== "string") return false;
      const owner = BrowserWindow.getFocusedWindow() ?? mainWindow;
      const options = {
        type: "question" as const,
        buttons: ["No", "Yes"],
        defaultId: 1,
        cancelId: 0,
        noLink: true,
        message: message.trim(),
      };
      const result = owner
        ? await dialog.showMessageBox(owner, options)
        : await dialog.showMessageBox(options);
      return result.response === 1;
    },
  );

  ipcMain.handle(
    IPC_CHANNELS.OPEN_EXTERNAL,
    async (_event, rawUrl: unknown) => {
      if (typeof rawUrl !== "string" || rawUrl.length === 0) return false;
      if (!isHttpUrl(rawUrl)) return false;

      try {
        await shell.openExternal(rawUrl);
        return true;
      } catch {
        return false;
      }
    },
  );

  ipcMain.handle(IPC_CHANNELS.UPDATE_CHECK, async () => {
    await checkForUpdates();
    return updateState;
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_DOWNLOAD, async () => {
    if (updateState.status !== "available") {
      return { accepted: false, state: updateState };
    }
    try {
      setUpdateState({ status: "downloading", downloadPercent: 0 });
      await autoUpdater.downloadUpdate();
      return { accepted: true, state: updateState };
    } catch (error: unknown) {
      setUpdateState({ status: "error", message: toErrorMessage(error) });
      return { accepted: false, state: updateState };
    }
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE_INSTALL, async () => {
    if (updateState.status !== "downloaded") {
      return { accepted: false, state: updateState };
    }
    isQuitting = true;
    autoUpdater.quitAndInstall();
    return { accepted: true, state: updateState };
  });
}

// ---------------------------------------------------------------------------
// Auto-updater
// ---------------------------------------------------------------------------

async function checkForUpdates(): Promise<void> {
  if (isDevelopment) return;

  setUpdateState({
    status: "checking",
    message: null,
    downloadPercent: null,
  });

  try {
    await autoUpdater.checkForUpdates();
  } catch (error: unknown) {
    setUpdateState({ status: "error", message: toErrorMessage(error) });
  }
}

function configureAutoUpdater(): void {
  if (isDevelopment) return;

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
      status: "downloading",
      downloadPercent: Math.floor(progress.percent),
    });
  });

  autoUpdater.on("update-downloaded", (info) => {
    setUpdateState({
      status: "downloaded",
      version: info.version,
      downloadPercent: 100,
    });
  });

  autoUpdater.on("error", (error) => {
    setUpdateState({ status: "error", message: error.message });
  });

  // Check for updates after a short delay on startup
  setTimeout(() => void checkForUpdates(), 15_000);
}

// ---------------------------------------------------------------------------
// Window creation
// ---------------------------------------------------------------------------

function createWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    ...getIconOption(),
    title: APP_DISPLAY_NAME,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: Path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler((details) => {
    if (isHttpUrl(details.url)) {
      void shell.openExternal(details.url);
    }
    return { action: "deny" };
  });

  window.on("page-title-updated", (event) => {
    event.preventDefault();
    window.setTitle(APP_DISPLAY_NAME);
  });

  window.once("ready-to-show", () => {
    window.show();
  });

  void window.loadURL(getWebAppUrl());

  if (isDevelopment) {
    window.webContents.openDevTools({ mode: "detach" });
  }

  window.on("closed", () => {
    if (mainWindow === window) {
      mainWindow = null;
    }
  });

  return window;
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.on("before-quit", () => {
  isQuitting = true;
});

app
  .whenReady()
  .then(() => {
    configureAppIdentity();
    configureApplicationMenu();
    configureAutoUpdater();
    registerIpcHandlers();

    mainWindow = createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createWindow();
      }
    });
  })
  .catch((error) => {
    console.error("[desktop] fatal startup error", error);
    dialog.showErrorBox("Init failed to start", toErrorMessage(error));
    app.quit();
  });

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Handle POSIX signals for clean shutdown
if (process.platform !== "win32") {
  const handleSignal = () => {
    if (isQuitting) return;
    isQuitting = true;
    app.quit();
  };
  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);
}
