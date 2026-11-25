import { app, Menu } from "electron";
import type { MenuItemConstructorOptions } from "electron";

interface MenuActions {
  development: boolean;
  onCheckForUpdates: (() => void) | null;
  onOpenSettings: () => void;
}

const DEVELOPMENT_VIEW: MenuItemConstructorOptions[] = [
  { role: "reload" },
  { role: "toggleDevTools" },
  { type: "separator" },
];

const viewMenu = (development: boolean) => {
  const items: MenuItemConstructorOptions[] = [
    ...(development ? DEVELOPMENT_VIEW : []),
    { role: "resetZoom" },
    { role: "zoomIn" },
    { role: "zoomOut" },
    { type: "separator" },
    { role: "togglefullscreen" },
  ];

  return items;
};

/**
 * The standard macOS menu, plus Settings… (⌘,) and, once updates are configured, Check for
 * Updates…. Windows and Linux draw a menu as a bar across the web app, so there the window has none.
 */
export const installMenu = ({ development, onCheckForUpdates, onOpenSettings }: MenuActions) => {
  if (process.platform !== "darwin") {
    Menu.setApplicationMenu(null);

    return;
  }

  const appMenu: MenuItemConstructorOptions[] = [
    { role: "about" },
    ...(onCheckForUpdates === null
      ? []
      : [{ click: onCheckForUpdates, label: "Check for Updates…" }]),
    { type: "separator" },
    { accelerator: "CmdOrCtrl+,", click: onOpenSettings, label: "Settings…" },
    { type: "separator" },
    { role: "services" },
    { type: "separator" },
    { role: "hide" },
    { role: "hideOthers" },
    { role: "unhide" },
    { type: "separator" },
    { role: "quit" },
  ];

  Menu.setApplicationMenu(
    Menu.buildFromTemplate([
      { label: app.name, submenu: appMenu },
      { role: "fileMenu" },
      { role: "editMenu" },
      { label: "View", submenu: viewMenu(development) },
      { role: "windowMenu" },
    ]),
  );
};
