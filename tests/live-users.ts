import { test } from "@playwright/test";

/**
 * Live-backend specs share one database, so each project gets its own test
 * users to avoid state cross-talk: desktop uses TEST_USER_A_JWT /
 * TEST_USER_B_JWT / TEST_MODERATOR_JWT; mobile uses the _M-suffixed variants.
 * (Authenticated routes are per-user rate limited, so parallel projects no
 * longer exhaust each other's budgets.)
 */
export function liveTokens() {
  const suffix = test.info().project.name === "mobile" ? "_M" : "";
  return {
    a: process.env[`TEST_USER_A_JWT${suffix}`],
    b: process.env[`TEST_USER_B_JWT${suffix}`],
    mod: process.env[`TEST_MODERATOR_JWT${suffix}`],
  };
}

/** Short per-project tag so aliases never collide across parallel projects. */
export function projectTag() {
  return test.info().project.name === "mobile" ? "M" : "";
}
