import { stripeClient } from "@better-auth/stripe/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "@repo/auth-shared/permissions";

export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient({ ac, roles }), stripeClient({ subscription: true })],
});
