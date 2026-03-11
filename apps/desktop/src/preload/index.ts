import { contextBridge, ipcRenderer } from "electron";

import { IPC_CHANNELS } from "../types";
import type { DesktopBridge } from "../types";

contextBridge.exposeInMainWorld("desktopBridge", {
  pickFolder: () => ipcRenderer.invoke(IPC_CHANNELS.PICK_FOLDER),
  confirm: (message: string) => ipcRenderer.invoke(IPC_CHANNELS.CONFIRM, message),
  openExternal: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_EXTERNAL, url),
  onMenuAction: (listener: (action: string) => void) => {
    const wrappedListener = (_event: Electron.IpcRendererEvent, action: unknown) => {
      if (typeof action !== "string") return;
      listener(action);
    };

    ipcRenderer.on(IPC_CHANNELS.MENU_ACTION, wrappedListener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MENU_ACTION, wrappedListener);
    };
  },
} satisfies DesktopBridge);
