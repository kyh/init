import type { ReactNode } from "react";
import { DocsLayout } from "fumadocs-ui/layouts/docs";

import { source } from "@/lib/source";

const Layout = ({ children }: { children: ReactNode }) => {
  return <DocsLayout tree={source.pageTree}>{children}</DocsLayout>;
};

export default Layout;
