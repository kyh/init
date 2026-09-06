import Constants from "expo-constants";

/** Use Metro’s host in development; standalone builds require EXPO_PUBLIC_API_URL. */
export const getBaseUrl = () => {
  const productionUrl = process.env.EXPO_PUBLIC_API_URL;
  if (productionUrl) {
    return productionUrl;
  }

  const debuggerHost = Constants.expoConfig?.hostUri;
  const localhost = debuggerHost?.split(":")[0];

  if (!localhost) {
    throw new Error("No dev server host found. Set EXPO_PUBLIC_API_URL for production builds.");
  }
  return `http://${localhost}:3000`;
};
