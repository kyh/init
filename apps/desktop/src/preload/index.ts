import { contextBridge, ipcRenderer } from "electron";
import type { IpcRendererEvent } from "electron";

import { APP_ORIGIN_ARG, channelOf } from "../shared/bridge";
import type { BridgeEvent, Command, EventPayloads, UpdateState } from "../shared/bridge";

const appOrigin = process.argv
  .find((argument) => argument.startsWith(APP_ORIGIN_ARG))
  ?.slice(APP_ORIGIN_ARG.length);

const ask = async (command: Command) => {
  const answer: unknown = await ipcRenderer.invoke(channelOf(command));

  return answer;
};

const subscribe = <E extends BridgeEvent>(
  event: E,
  listener: (payload: EventPayloads[E]) => void,
) => {
  const channel = channelOf(event);

  const forward = (_event: IpcRendererEvent, payload: EventPayloads[E]) => {
    listener(payload);
  };

  ipcRenderer.on(channel, forward);

  return () => {
    ipcRenderer.removeListener(channel, forward);
  };
};

if (appOrigin !== undefined && globalThis.location.origin === appOrigin) {
  contextBridge.exposeInMainWorld("desktopBridge", {
    checkForUpdates: async () => await ask("check-for-updates"),
    downloadUpdate: async () => await ask("download-update"),
    installUpdate: async () => await ask("install-update"),
    onMenuAction: (listener: (action: string) => void) => subscribe("menu-action", listener),
    onUpdateState: (listener: (state: UpdateState) => void) => subscribe("update-state", listener),
  });
}
