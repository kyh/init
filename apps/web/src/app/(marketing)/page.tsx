import type { Metadata } from "next";
import Link from "next/link";

import { Meteors } from "@/app/(marketing)/_components/meteor";
import { WaitlistForm } from "@/app/(marketing)/_components/waitlist-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
      logo: `${siteConfig.url}/logo.svg`,
    },
    {
      "@type": "WebSite",
      name: siteConfig.name,
      description: siteConfig.description,
      url: siteConfig.url,
    },
  ],
};

const jsonLdScript = JSON.stringify(jsonLd).replaceAll("<", "\\u003c");

const Page = () => {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript }} />
      <section>
        <div className="border-border relative mx-auto max-w-7xl border-x border-b p-8 lg:py-32">
          <div className="max-w-2xl">
            <span className="text-muted-foreground font-light">For you and your coding agents</span>
            <h1 className="text-secondary-foreground mt-6 text-2xl font-light text-pretty">
              An AI native starter kit to build, launch, and scale your next project.
            </h1>
            <WaitlistForm />
          </div>
          <Meteors />
        </div>
      </section>
      <section>
        <div className="border-border mx-auto max-w-7xl border-x border-b p-8 lg:py-16">
          <div className="max-w-2xl">
            <span className="text-muted-foreground font-light">Built to be driven by agents</span>
            <h2 className="text-secondary-foreground mt-6 text-xl font-light text-pretty">
              Clone to running app in one command — then let your agent prove the change works, not
              just typecheck it.
            </h2>
            <Link
              href="/docs/overview/agent-driven-development"
              className="text-muted-foreground hover:text-secondary-foreground mt-6 inline-block text-sm underline underline-offset-4 transition-colors"
            >
              Read the agent workflow →
            </Link>
          </div>
        </div>
        <div className="border-border mx-auto max-w-7xl border-x border-b">
          <div className="divide-gray text-secondary-foreground grid grid-cols-1 md:grid-cols-4 md:divide-x">
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Provision</div>
              <div className="text-muted-foreground space-y-3">
                <p>Postgres, env, schema, and a seeded login stood up with no prompts.</p>
                <p className="font-mono text-sm">pnpm bootstrap --yes</p>
              </div>
            </div>
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Drive</div>
              <div className="text-muted-foreground space-y-3">
                <p>Your agent opens the real web app and clicks through the actual UI.</p>
                <p className="font-mono text-sm">agent-browser open</p>
              </div>
            </div>
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Emulate</div>
              <div className="text-muted-foreground space-y-3">
                <p>A local server fakes GitHub OAuth, so the login flow tests with no network.</p>
                <p className="font-mono text-sm">pnpm emulate</p>
              </div>
            </div>
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Verify</div>
              <div className="text-muted-foreground space-y-3">
                <p>One gate — typecheck, lint, format, test — the same checks CI runs.</p>
                <p className="font-mono text-sm">pnpm verify</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className="border-border mx-auto max-w-7xl border-x border-b">
          <div className="divide-gray text-secondary-foreground grid grid-cols-1 md:grid-cols-3 md:divide-x">
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Build</div>
              <div className="text-muted-foreground space-y-3">
                <p>
                  One TypeScript stack, typed end-to-end from database to UI, shipping to web,
                  mobile, extension, and desktop.
                </p>
                <p className="text-sm italic">Your first commit is a feature, not plumbing.</p>
              </div>
            </div>
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Launch</div>
              <div className="text-muted-foreground space-y-3">
                <p>
                  Push to deploy: CI, transactional email, and a production checklist come wired.
                </p>
                <p className="text-sm italic">
                  The distance between working locally and live for users is a git push.
                </p>
              </div>
            </div>
            <div className="flex h-full flex-col gap-6 p-8">
              <div>Scale</div>
              <div className="text-muted-foreground space-y-3">
                <p>
                  Multi-tenant from day one, typed end-to-end, documented by a self-updating agent
                  wiki.
                </p>
                <p className="text-sm italic">
                  Grow by copying the patterns already there, not rewriting the architecture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Page;
