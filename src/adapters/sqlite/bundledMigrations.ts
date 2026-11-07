// Spec: DS-002
import type { Migration } from "./runMigrations";

const files = import.meta.glob<string>("./migrations/*.sql", { query: "?raw", import: "default", eager: true });

/** All migration files `NNNN_<name>.sql`, sorted by version. */
export function bundledMigrations(): Migration[] {
  return Object.entries(files)
    .map(([path, sql]) => {
      const match = /\/(\d{4})_([^/]+)\.sql$/.exec(path);
      if (!match) {
        throw new Error(`Invalid migration file name: ${path}`);
      }
      return { version: Number(match[1]), name: match[2], sql };
    })
    .sort((a, b) => a.version - b.version);
}
