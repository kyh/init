import * as fs from "node:fs";
import path from "node:path";

import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from "electron";
import type { MenuItemConstructorOptions } from "electron";
import { autoUpdater } from "electron-updater";

import { IPC_CHANNELS, isHttpUrl, toErrorMessage } from "../types";

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

function ensureWindow(): BrowserWindow {
  const existing =
    BrowserWindow.getFocusedWindow() ?? mainWindow ?? BrowserWindow.getAllWindows()[0];
  if (existing) return existing;
  mainWindow = createWindow();
  return mainWindow;
}

function dispatchMenuAction(action: string): void {
  const win = ensureWindow();

  const send = () => {
    if (win.isDestroyed()) return;
    if (!win.isVisible()) win.show();
    win.focus();
    win.webContents.send(IPC_CHANNELS.MENU_ACTION, action);
  };

  if (win.webContents.isLoadingMainFrame()) {
    win.webContents.once("did-finish-load", send);
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
  );

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ---------------------------------------------------------------------------
// Icon resolution
// ---------------------------------------------------------------------------

function resolveIconPath(ext: "ico" | "icns" | "png"): string | null {
  const candidates = [
    path.join(__dirname, "../../resources", `icon.${ext}`),
    path.join(process.resourcesPath, "resources", `icon.${ext}`),
    path.join(process.resourcesPath, `icon.${ext}`),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}

let cachedIconOption: Partial<{ icon: string }> | null = null;

function getIconOption(): Partial<{ icon: string }> {
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

  ipcMain.handle(IPC_CHANNELS.CONFIRM, async (_event, message: unknown) => {
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
  });

  ipcMain.handle(IPC_CHANNELS.OPEN_EXTERNAL, async (_event, rawUrl: unknown) => {
    if (typeof rawUrl !== "string" || rawUrl.length === 0) return false;
    if (!isHttpUrl(rawUrl)) return false;

    try {
      await shell.openExternal(rawUrl);
      return true;
    } catch {
      return false;
    }
  });
}

// ---------------------------------------------------------------------------
// Auto-updater (electron-builder built-in)
// ---------------------------------------------------------------------------

function configureAutoUpdater(): void {
  if (isDevelopment) return;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on("error", (error) => {
    console.error("[desktop] auto-updater error:", error.message);
  });

  autoUpdater.checkForUpdatesAndNotify().catch((error: unknown) => {
    console.error("[desktop] update check failed:", toErrorMessage(error));
  });
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
    // On macOS the hidden inset title bar replaces the menu bar; on
    // Windows/Linux keep the menu visible so Settings (CmdOrCtrl+,) is
    // discoverable.
    autoHideMenuBar: process.platform === "darwin",
    ...getIconOption(),
    title: APP_DISPLAY_NAME,
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
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
      } else {
        mainWindow?.show();
        mainWindow?.focus();
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
