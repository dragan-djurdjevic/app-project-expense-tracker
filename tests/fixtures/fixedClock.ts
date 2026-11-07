// Spec: AR-004
import type { Clock } from "../../src/core/ports/Clock";
import type { IdGenerator } from "../../src/core/ports/IdGenerator";

export function fixedClock(iso = "2026-01-01T00:00:00.000Z"): Clock {
  return { now: () => new Date(iso) };
}

export function sequentialIds(prefix = "00000000-0000-4000-8000-"): IdGenerator {
  let counter = 0;
  return { next: () => `${prefix}${String(++counter).padStart(12, "0")}` };
}
