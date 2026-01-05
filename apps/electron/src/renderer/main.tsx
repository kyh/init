import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { GlobalToaster } from "@repo/ui/toast";
import { ThemeProvider } from "@repo/ui/theme";

import { DashboardLayout } from "./components/dashboard-layout";
import { TRPCReactProvider } from "./lib/trpc";
import { HomePage } from "./pages/home";
import { TodosPage } from "./pages/todos";
import { SettingsPage } from "./pages/settings";
import { AboutPage } from "./pages/about";

import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TRPCReactProvider>
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
    </TRPCReactProvider>
  </StrictMode>,
);
