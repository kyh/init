// Normalize before checking origin: browsers treat backslashes and control characters as URL syntax.
export const safeNextPath = (nextPath?: string): string => {
  if (!nextPath?.startsWith("/")) {
    return "/dashboard";
  }
  try {
    const url = new URL(nextPath, "http://internal");
    return url.origin === "http://internal"
      ? `${url.pathname}${url.search}${url.hash}`
      : "/dashboard";
  } catch {
    return "/dashboard";
  }
};
