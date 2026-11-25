export const safeNextPath = (nextPath?: string) => {
  if (nextPath?.startsWith("/") !== true) {
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
