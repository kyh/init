import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/utils/api";

import "../styles.css";

// React Navigation needs concrete colors; keep aligned with styles.css background tokens.
const BACKGROUND_LIGHT = "#ffffff";
const BACKGROUND_DARK = "#09090b";

const RootLayout = () => {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? BACKGROUND_DARK : BACKGROUND_LIGHT;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          contentStyle: {
            backgroundColor,
          },
          headerStyle: {
            backgroundColor,
          },
        }}
      />
      <StatusBar />
    </QueryClientProvider>
  );
};

export default RootLayout;
