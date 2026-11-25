import electronUpdater from "electron-updater";

import type { UpdateState } from "../shared/bridge";

const messageOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause));

const isBusy = (state: UpdateState) =>
  state.status === "checking" || state.status === "downloading" || state.status === "downloaded";

/**
 * The update flow the web app drives. Nothing moves without the user: the banner checks when the
 * page loads, and the download and the restart each wait for a click; a downloaded update also
 * installs when the app quits, as electron-updater does by default.
 */
export const createUpdater = (enabled: boolean, announce: (state: UpdateState) => void) => {
  const { autoUpdater } = electronUpdater;
  let state: UpdateState = { status: "idle" };

  const publish = (next: UpdateState) => {
    state = next;
    announce(next);

    return next;
  };

  if (enabled) {
    autoUpdater.autoDownload = false;
    autoUpdater.on("error", (error) => {
      if (state.status === "downloaded") {
        publish({ message: error.message, status: "error" });
      }
    });
    autoUpdater.on("download-progress", (progress) => {
      if (state.status === "downloading") {
        publish({
          downloadPercent: Math.min(100, Math.floor(progress.percent)),
          status: "downloading",
        });
      }
    });
  }

  const check = async () => {
    if (!enabled || isBusy(state)) {
      return state;
    }

    publish({ status: "checking" });

    try {
      const result = await autoUpdater.checkForUpdates();

      return result?.isUpdateAvailable
        ? publish({ status: "available", version: result.updateInfo.version })
        : publish({ status: "not-available" });
    } catch (error: unknown) {
      return publish({ message: messageOf(error), status: "error" });
    }
  };

  const download = async () => {
    if (state.status !== "available") {
      return state;
    }

    const { version } = state;
    publish({ downloadPercent: 0, status: "downloading" });

    try {
      await autoUpdater.downloadUpdate();

      return publish({ status: "downloaded", version });
    } catch (error: unknown) {
      return publish({ message: messageOf(error), status: "error" });
    }
  };

  const install = () => {
    if (state.status !== "downloaded") {
      return state;
    }

    setImmediate(() => {
      try {
        autoUpdater.quitAndInstall();
      } catch (error: unknown) {
        publish({ message: messageOf(error), status: "error" });
      }
    });

    return state;
  };

  return { check, download, enabled, install };
};

export type Updater = ReturnType<typeof createUpdater>;
