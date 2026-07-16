import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";

type ImageConfig = NonNullable<NextConfig["images"]>;
type RemotePatterns = NonNullable<ImageConfig["remotePatterns"]>;
type LocalPatterns = NonNullable<ImageConfig["localPatterns"]>;

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

const getRemotePatterns = (): RemotePatterns => {
  const remotePatterns: RemotePatterns = [];

  if (SUPABASE_URL) {
    const hostname = new URL(SUPABASE_URL).hostname;

    remotePatterns.push({
      protocol: "https",
      hostname,
    });
  }

  if (!IS_PRODUCTION) {
    remotePatterns.push({
      protocol: "http",
      hostname: "127.0.0.1",
    });

    remotePatterns.push({
      protocol: "http",
      hostname: "localhost",
    });
  }

  return remotePatterns;
};

const getLocalPatterns = (): LocalPatterns => [
  {
    pathname: "/assets/**",
  },
];

const transpilePackages = ["@repo/api", "@repo/db", "@repo/ui"];

const withMDX = createMDX();

const config: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  transpilePackages,
  images: {
    remotePatterns: getRemotePatterns(),
    localPatterns: getLocalPatterns(),
  },
  /** We already do linting and typechecking as separate tasks in CI */
  typescript: { ignoreBuildErrors: true },
  /**
   * RFC 8288 Link headers pointing agents at discovery resources.
   * api-catalog (RFC 9727) and service-doc (RFC 8631) are IANA-registered rels.
   */
  async headers() {
    const link = [
      '</.well-known/api-catalog>; rel="api-catalog"',
      '</docs/architecture/api>; rel="service-doc"; type="text/html"',
      '</llms.txt>; rel="alternate"; type="text/plain"',
    ].join(", ");

    return [
      {
        source: "/",
        headers: [{ key: "Link", value: link }],
      },
    ];
  },
};

export default withMDX(config);
