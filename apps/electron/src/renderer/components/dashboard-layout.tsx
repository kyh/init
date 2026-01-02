import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
