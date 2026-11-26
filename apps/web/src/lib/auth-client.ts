import { stripeClient } from "@better-auth/stripe/client";
import { adminClient, emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { ac, roles } from "@repo/permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    emailOTPClient(),
    organizationClient({ ac, roles }),
    stripeClient({ subscription: true }),
  ],
});
