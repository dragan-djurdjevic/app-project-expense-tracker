// Spec: AR-004
import type { Clock } from "../../src/core/ports/Clock";

/** Clock whose time is set by the test. */
export function controlledClock(iso = "2026-01-01T00:00:00.000Z"): Clock & { set(iso: string): void } {
  let current = new Date(iso);
  return {
    now: () => new Date(current),
    set: (next) => {
      current = new Date(next);
    },
  };
}
