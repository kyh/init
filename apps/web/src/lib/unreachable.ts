/** Ends a switch that names every case, so a case added to the union fails to compile there. */
export const unreachable = (value: never) => {
  throw new Error(`Unhandled case: ${JSON.stringify(value)}`);
};
