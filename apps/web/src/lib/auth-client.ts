import { stripeClient } from "@better-auth/stripe/client";
import { adminClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "@repo/api/auth/permissions";

export const authClient = createAuthClient({
  plugins: [adminClient(), organizationClient({ ac, roles }), stripeClient({ subscription: true })],
});
