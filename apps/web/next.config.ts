import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

type ImageConfig = NonNullable<NextConfig["images"]>;

type RemotePatterns = NonNullable<ImageConfig["remotePatterns"]>;

const IS_PRODUCTION = process.env.NODE_ENV === "production";

const getRemotePatterns = () => {
  const remotePatterns: RemotePatterns = [
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
  agentRules: false,
  cacheComponents: true,
  headers: () => {
    const link = [
      '</.well-known/api-catalog>; rel="api-catalog"',
      '</openapi.json>; rel="service-desc"; type="application/openapi+json"',
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
  partialPrefetching: true,
  transpilePackages: [
    "@repo/contract",
    "@repo/db",
    "@repo/permissions",
    "@repo/service",
    "@repo/ui",
  ],
};

export default withMDX(config);
