declare global {
  interface Window {
    api: {
      getAppVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
    };
  }
}

export {};
