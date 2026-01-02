import { useCallback, useEffect, useState } from "react";

import { getAuthClient } from "@/lib/auth";
import { getStorageData, setStorageData } from "@/lib/storage";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

type OrganizationsState = {
  isLoading: boolean;
  organizations: Organization[];
  activeOrganization: Organization | null;
  error: string | null;
};

export function useOrganizations() {
  const [state, setState] = useState<OrganizationsState>({
    isLoading: true,
    organizations: [],
    activeOrganization: null,
    error: null,
  });

  const fetchOrganizations = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const authClient = await getAuthClient();
      const orgsResult = await authClient.organization.list();

      if (orgsResult.error) {
        throw new Error(orgsResult.error.message);
      }

      const organizations: Organization[] = (orgsResult.data ?? []).map(
        (org) => ({
          id: org.id,
          name: org.name,
          slug: org.slug,
          logo: org.logo,
        }),
      );

      // Get stored active organization
      const storedActiveOrg = await getStorageData("activeOrganization");
      let activeOrganization = storedActiveOrg;

      // If no stored active org, or it's not in the list, use the first one
      if (
        !activeOrganization ||
        !organizations.find((org) => org.id === activeOrganization?.id)
      ) {
        activeOrganization = organizations[0] ?? null;
        if (activeOrganization) {
          await setStorageData("activeOrganization", activeOrganization);
        }
      }

      setState({
        isLoading: false,
        organizations,
        activeOrganization,
        error: null,
      });
    } catch (err) {
      const error =
        err instanceof Error ? err.message : "Failed to fetch organizations";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error,
      }));
    }
  }, []);

  const setActiveOrganization = useCallback(async (org: Organization) => {
    await setStorageData("activeOrganization", org);

    // Also update the server-side active organization
    try {
      const authClient = await getAuthClient();
      await authClient.organization.setActive({ organizationId: org.id });
    } catch {
      // Ignore server-side errors, the local storage is the source of truth for the extension
    }

    setState((prev) => ({
      ...prev,
      activeOrganization: org,
    }));
  }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    ...state,
    fetchOrganizations,
    setActiveOrganization,
  };
}
