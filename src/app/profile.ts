// Spec: AR-013
/** AR-013: the two data profiles; each has its own DB file and documents folder. */
export const PROFILES = ["live", "demo"] as const;
export type Profile = (typeof PROFILES)[number];

/** AR-013: browser mode is `demo` only when the URL query has `profile=demo` exactly, otherwise `live`. */
export function profileFromSearch(search: string): Profile {
  return new URLSearchParams(search).getAll("profile").includes("demo") ? "demo" : "live";
}
