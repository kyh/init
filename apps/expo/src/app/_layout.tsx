import "@bacons/text-decoder/install";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";

import { queryClient } from "@/trpc/react";

import "./styles/globals.css";

// This is the main layout of the app
// It wraps your pages with the providers they need
const RootLayout = () => {
  const { colorScheme } = useColorScheme();
  return (
    <QueryClientProvider client={queryClient}>
      {/*
          The Stack component displays the current page.
          It also allows you to configure your screens 
        */}
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: "#000",
          },
          contentStyle: {
            backgroundColor: colorScheme == "dark" ? "#09090B" : "#FFFFFF",
          },
        }}
      />
      <StatusBar />
    </QueryClientProvider>
  );
};

export default RootLayout;
