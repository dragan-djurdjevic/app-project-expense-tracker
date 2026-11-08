// Spec: AR-009, AR-007, AN-900
import { analyticsFixture } from "../../tests/fixtures/analytics";
import { basicFixture } from "../../tests/fixtures/basic";
import type { Fixture } from "./testHooks";

/** Fixtures for `window.__TEST__.seed(name)`; loaded only in the `e2e` build. */
export const e2eFixtures: Record<string, Fixture> = {
  basic: basicFixture,
  analytics: analyticsFixture,
};
