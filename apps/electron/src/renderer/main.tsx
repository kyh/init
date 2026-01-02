import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GlobalToaster } from "@repo/ui/toast";
import { ThemeProvider } from "@repo/ui/theme";

import { DashboardLayout } from "./components/dashboard-layout";
import { HomePage } from "./pages/home";
import { TodosPage } from "./pages/todos";
import { SettingsPage } from "./pages/settings";
import { AboutPage } from "./pages/about";

import "./styles/globals.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="init-theme">
        <HashRouter>
          <Routes>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<HomePage />} />
              <Route path="todos" element={<TodosPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="about" element={<AboutPage />} />
            </Route>
          </Routes>
        </HashRouter>
        <GlobalToaster />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
