import { useState } from "react";
import { Button } from "@repo/ui/button";
import { cn } from "@repo/ui/utils";
import {
  LogOut,
  Settings,
  ListTodo,
  MessageSquare,
  RefreshCw,
} from "lucide-react";

import { AIChat } from "@/components/ai-chat";
import { LoginForm } from "@/components/login-form";
import { OrganizationSelector } from "@/components/organization-selector";
import { TodoList } from "@/components/todo-list";
import { useAuth } from "@/hooks/use-auth";
import { useOrganizations } from "@/hooks/use-organizations";

type Tab = "todos" | "chat";

function App() {
  const {
    isLoading: authLoading,
    isAuthenticated,
    session,
    signOut,
    refreshSession,
  } = useAuth();
  const {
    isLoading: orgsLoading,
    organizations,
    activeOrganization,
    setActiveOrganization,
    fetchOrganizations,
  } = useOrganizations();

  const [activeTab, setActiveTab] = useState<Tab>("todos");

  const handleSignOut = async () => {
    await signOut();
  };

  const handleLoginSuccess = () => {
    refreshSession();
    fetchOrganizations();
  };

  const openOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex h-[500px] w-[360px] items-center justify-center">
        <RefreshCw className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="h-[500px] w-[360px]">
        <LoginForm onSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="flex h-[500px] w-[360px] flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b p-2">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold">Init</h1>
          {session?.user && (
            <span className="max-w-[120px] truncate text-xs text-muted-foreground">
              {session.user.name}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={openOptions}
            title="Settings"
            className="size-7"
          >
            <Settings className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleSignOut}
            title="Sign out"
            className="size-7"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      </header>

      {/* Organization Selector */}
      <div className="border-b p-2">
        <OrganizationSelector
          organizations={organizations}
          activeOrganization={activeOrganization}
          onSelect={setActiveOrganization}
          isLoading={orgsLoading}
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("todos")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors",
            activeTab === "todos"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ListTodo className="size-4" />
          Todos
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors",
            activeTab === "chat"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare className="size-4" />
          Chat
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeOrganization ? (
          activeTab === "todos" ? (
            <div className="h-full overflow-y-auto p-2">
              <TodoList slug={activeOrganization.slug} />
            </div>
          ) : (
            <AIChat slug={activeOrganization.slug} />
          )
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Select an organization to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
