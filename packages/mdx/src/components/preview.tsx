import type React from "react";

export const Preview = ({
  children,
  codeblock,
}: React.HTMLAttributes<HTMLDivElement> & { codeblock?: string }) => (
  <span data-with-codeblock={codeblock}>{children}</span>
);
