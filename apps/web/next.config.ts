import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

type ImageConfig = NonNullable<NextConfig["images"]>;
type RemotePatterns = NonNullable<ImageConfig["remotePatterns"]>;

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const getRemotePatterns = (): RemotePatterns => {
  const remotePatterns: RemotePatterns = [
    // Avatar uploads land on the Vercel Blob store's public CDN host,
    // <store-id>.public.blob.vercel-storage.com
    {
      hostname: "**.public.blob.vercel-storage.com",
      protocol: "https",
    },
  ];

  if (!IS_PRODUCTION) {
    remotePatterns.push(
      {
        hostname: "127.0.0.1",
        protocol: "http",
      },
      {
        hostname: "localhost",
        protocol: "http",
      },
    );
  }

  return remotePatterns;
};

const withMDX = createMDX();

const config: NextConfig = {
  /** next dev rewrites AGENTS.md/CLAUDE.md when it detects an agent; we own those files */
  agentRules: false,
  /**
   * RFC 8288 Link headers pointing agents at discovery resources.
   * api-catalog (RFC 9727) and service-doc (RFC 8631) are IANA-registered rels.
   */
  headers: () => {
    const link = [
      '</.well-known/api-catalog>; rel="api-catalog"',
      '</docs/architecture/api>; rel="service-doc"; type="text/html"',
      '</llms.txt>; rel="alternate"; type="text/plain"',
    ].join(", ");

    return Promise.resolve([
      {
        headers: [{ key: "Link", value: link }],
        source: "/",
      },
    ]);
  },
  images: {
    localPatterns: [{ pathname: "/assets/**" }],
    remotePatterns: getRemotePatterns(),
  },
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  transpilePackages: ["@repo/api", "@repo/db", "@repo/ui"],
};

export default withMDX(config);
