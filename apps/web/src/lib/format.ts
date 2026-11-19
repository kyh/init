const dateFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC" });

/** UTC keeps server and client output identical during hydration. */
export const formatDate = (value: Date | string | number) => dateFormatter.format(new Date(value));
