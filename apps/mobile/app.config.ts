import type { ConfigContext, ExpoConfig } from "expo/config";

const appConfig = ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  android: {
    adaptiveIcon: {
      backgroundColor: "#1F104A",
      foregroundImage: "./assets/icon-light.png",
    },
    package: "your.bundle.identifier",
  },
  assetBundlePatterns: ["**/*"],
  experiments: {
    reactCompiler: true,
    tsconfigPaths: true,
    typedRoutes: true,
  },
  icon: "./assets/icon-light.png",
  ios: {
    bundleIdentifier: "your.bundle.identifier",
    icon: {
      dark: "./assets/icon-dark.png",
      light: "./assets/icon-light.png",
    },
    supportsTablet: true,
  },
  name: "expo",
  orientation: "portrait",
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#E4E4E7",
        dark: {
          backgroundColor: "#18181B",
          image: "./assets/icon-dark.png",
        },
        image: "./assets/icon-light.png",
      },
    ],
  ],
  scheme: "expo",
  slug: "expo",
  userInterfaceStyle: "automatic",
  version: "0.1.0",
});

export default appConfig;
