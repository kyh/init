import { contextBridge, ipcRenderer } from "electron";

// Custom APIs for renderer
const api = {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke("get-app-version"),
  getPlatform: (): Promise<string> => ipcRenderer.invoke("get-platform"),
};

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  // @ts-expect-error (define in dts)
  window.api = api;
}
