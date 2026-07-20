const dateFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "UTC" });

/**
 * Formats a date in UTC using the en-US short style. Formatting in a fixed zone
 * keeps the server and client render identical, so a date can't trigger a
 * hydration mismatch.
 */
export const formatDate = (value: Date | string | number): string =>
  dateFormatter.format(new Date(value));
