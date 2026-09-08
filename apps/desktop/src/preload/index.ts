import { contextBridge, ipcRenderer } from "electron";
import { z } from "zod";

import { IPC_CHANNELS, updateStateSchema } from "../types";
import type { DesktopBridge, UpdateState } from "../types";

const menuActionSchema = z.string();

contextBridge.exposeInMainWorld("desktopBridge", {
  checkForUpdates: async () =>
    updateStateSchema.parse(await ipcRenderer.invoke(IPC_CHANNELS.UPDATE_CHECK)),
  downloadUpdate: async () =>
    updateStateSchema.parse(await ipcRenderer.invoke(IPC_CHANNELS.UPDATE_DOWNLOAD)),
  installUpdate: async () =>
    updateStateSchema.parse(await ipcRenderer.invoke(IPC_CHANNELS.UPDATE_INSTALL)),
  onMenuAction: (listener: (action: string) => void) => {
    const wrappedListener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      const action = menuActionSchema.safeParse(args[0]);
      if (!action.success) {
        return;
      }
      listener(action.data);
    };

    ipcRenderer.on(IPC_CHANNELS.MENU_ACTION, wrappedListener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MENU_ACTION, wrappedListener);
    };
  },
  onUpdateState: (listener: (state: UpdateState) => void) => {
    const wrappedListener = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => {
      const state = updateStateSchema.safeParse(args[0]);
      if (!state.success) {
        return;
      }
      listener(state.data);
    };

    ipcRenderer.on(IPC_CHANNELS.UPDATE_STATE, wrappedListener);
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.UPDATE_STATE, wrappedListener);
    };
  },
} satisfies DesktopBridge);
