import path from "node:path";

import { app, BrowserWindow, shell } from "electron";
import type { WebContents } from "electron";

import { APP_ORIGIN_ARG } from "../shared/bridge";
import { classify, isWebUrl } from "./navigation";

const CONNECTION_REFUSED = -102;
const DEV_RETRY_MS = 500;

const openExternally = async (url: string) => {
  if (!isWebUrl(url)) {
    return;
  }

  try {
    await shell.openExternal(url);
  } catch (error: unknown) {
    console.error(`[desktop] could not open ${url} in the browser`, error);
  }
};

const load = async (window: BrowserWindow, url: string) => {
  try {
    await window.loadURL(url);
  } catch (error: unknown) {
    console.error(`[desktop] could not load ${url}`, error);
  }
};

/**
 * Pins every web contents the app creates: the web app's origin and the OAuth providers load in
 * it, any other web page opens in the browser, no page gets a second window, a webview or a
 * device permission, and a frame may load only an allowed origin.
 */
export const pinNavigation = (allowed: readonly string[]) => {
  const guard = (event: Electron.Event<{ isMainFrame: boolean; url: string }>) => {
    const verdict = classify(event.url, allowed);

    if (verdict === "allow") {
      return;
    }

    event.preventDefault();

    if (event.isMainFrame && verdict === "open-externally") {
      void openExternally(event.url);
    }
  };

  app.on("web-contents-created", (_event, contents: WebContents) => {
    contents.setWindowOpenHandler(({ url }) => {
      void openExternally(url);

      return { action: "deny" };
    });
    contents.on("will-attach-webview", (event) => {
      event.preventDefault();
    });
    contents.on("will-frame-navigate", guard);
    contents.on("will-redirect", guard);
    contents.session.setPermissionRequestHandler((_contents, _permission, answer) => {
      answer(false);
    });
    contents.session.setPermissionCheckHandler(() => false);
  });
};

interface WindowOptions {
  appUrl: string;
  development: boolean;
  title: string;
}

/** The one window, on the web app's URL. */
export const createMainWindow = ({ appUrl, development, title }: WindowOptions) => {
  const window = new BrowserWindow({
    height: 800,
    minHeight: 600,
    minWidth: 800,
    show: false,
    title,
    webPreferences: {
      additionalArguments: [`${APP_ORIGIN_ARG}${new URL(appUrl).origin}`],
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(import.meta.dirname, "../preload/index.cjs"),
      sandbox: true,
      webSecurity: true,
    },
    width: 1200,
  });

  window.on("page-title-updated", (event) => {
    event.preventDefault();
  });
  window.once("ready-to-show", () => {
    window.show();
  });

  if (development) {
    window.webContents.on("did-fail-load", (_event, code, _description, url, isMainFrame) => {
      if (isMainFrame && code === CONNECTION_REFUSED) {
        setTimeout(() => {
          if (!window.isDestroyed()) {
            void load(window, url);
          }
        }, DEV_RETRY_MS);
      }
    });
  }

  void load(window, appUrl);

  return window;
};

/** Brings the window forward for a menu item that needs the page. */
export const showWindow = (window: BrowserWindow) => {
  if (window.isMinimized()) {
    window.restore();
  }

  window.show();
  window.focus();
};
