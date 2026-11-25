import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

import { APP_ORIGIN_ARG, channelOf, isBridgeEvent, isCommand } from "../shared/bridge";
import type { EventPayload, UpdateState } from "../shared/bridge";

const appOrigin = process.argv
  .find((argument) => argument.startsWith(APP_ORIGIN_ARG))
  ?.slice(APP_ORIGIN_ARG.length);

if (appOrigin !== undefined && globalThis.location.origin === appOrigin) {
  contextBridge.exposeInMainWorld("desktopBridge", {
    invoke: async (command: string) => {
      if (!isCommand(command)) {
        throw new Error(`The desktop app has no command ${command}`);
      }

      const state: UpdateState = await ipcRenderer.invoke(channelOf(command));

      return state;
    },
    on: (event: string, listener: (payload: EventPayload) => void) => {
      if (!isBridgeEvent(event)) {
        return () => null;
      }

      const channel = channelOf(event);

      const forward = (_event: IpcRendererEvent, payload: EventPayload) => {
        listener(payload);
      };

      ipcRenderer.on(channel, forward);

      return () => {
        ipcRenderer.removeListener(channel, forward);
      };
    },
  });
}
