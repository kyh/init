import { useCallback, useEffect, useState } from "react";

import { getSession, signOut as authSignOut, checkAuth } from "@/lib/auth";
import { getStorageData, setStorageData, onStorageChange } from "@/lib/storage";

type User = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

type Session = {
  user: User;
  activeOrganizationId?: string;
};

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  session: Session | null;
  error: string | null;
};

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    session: null,
    error: null,
  });

  const refreshSession = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const sessionData = await getSession();

      if (sessionData?.session && sessionData?.user) {
        const session: Session = {
          user: {
            id: sessionData.user.id,
            name: sessionData.user.name,
            email: sessionData.user.email,
            image: sessionData.user.image ?? undefined,
          },
          activeOrganizationId:
            (sessionData.session as { activeOrganizationId?: string })
              .activeOrganizationId ?? undefined,
        };

        await setStorageData("session", {
          token: "",
          user: session.user,
          activeOrganizationId: session.activeOrganizationId,
        });

        setState({
          isLoading: false,
          isAuthenticated: true,
          session,
          error: null,
        });
      } else {
        await setStorageData("session", null);
        setState({
          isLoading: false,
          isAuthenticated: false,
          session: null,
          error: null,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to get session";
      setState({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        error,
      });
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      await authSignOut();
      await setStorageData("session", null);
      await setStorageData("activeOrganization", null);

      setState({
        isLoading: false,
        isAuthenticated: false,
        session: null,
        error: null,
      });
    } catch (err) {
      const error = err instanceof Error ? err.message : "Failed to sign out";
      setState((prev) => ({ ...prev, isLoading: false, error }));
    }
  }, []);

  useEffect(() => {
    refreshSession();

    // Listen for storage changes (e.g., from options page)
    const unsubscribe = onStorageChange((changes) => {
      if (changes.apiBaseUrl) {
        refreshSession();
      }
    });

    return unsubscribe;
  }, [refreshSession]);

  return {
    ...state,
    refreshSession,
    signOut,
  };
}
