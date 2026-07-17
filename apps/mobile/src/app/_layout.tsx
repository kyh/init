import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/utils/api";

import "../styles.css";

// React Navigation needs a concrete color string — it can't resolve a CSS
// var(). These mirror the --background token in styles.css (light:
// hsl(0 0% 100%), dark: hsl(240 10% 3.9%)); keep in sync if that token moves.
const BACKGROUND_LIGHT = "#ffffff";
const BACKGROUND_DARK = "#09090b";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === "dark" ? BACKGROUND_DARK : BACKGROUND_LIGHT;

  return (
    <QueryClientProvider client={queryClient}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor,
          },
          contentStyle: {
            backgroundColor,
          },
        }}
      />
      <StatusBar />
    </QueryClientProvider>
  );
}
