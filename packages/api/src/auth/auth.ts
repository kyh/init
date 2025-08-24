import { cache } from "react";
import { headers } from "next/headers";
import { expo } from "@better-auth/expo";
import { db } from "@repo/db/drizzle-client";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, oAuthProxy, organization } from "better-auth/plugins";

const baseUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const auth: ReturnType<typeof betterAuth> = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  baseURL: baseUrl,
  secret: process.env.BETTER_AUTH_SECRET ?? "",
  plugins: [
    oAuthProxy({
      currentURL: baseUrl,
      productionURL: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "init.kyh.io"}`,
    }),
    expo(),
    organization(),
    admin(),
  ],
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
      redirectURI: `${baseUrl}/api/auth/callback/github`,
    },
  },
  trustedOrigins: ["expo://"],
});

export type Auth = typeof auth;
export type Session = Auth["$Infer"]["Session"];

export const getSession = cache(async () =>
  auth.api.getSession({ headers: await headers() }),
);
