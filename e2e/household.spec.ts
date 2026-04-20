// E2E tests for the two-user household flow.
// To run these tests, install Playwright first:
//   npm install -D @playwright/test
//   npx playwright install
//
// Then run: npm run test:e2e

import { test } from "@playwright/test";

test.describe("Household invite flow", () => {
  test.todo(
    "User A invites User B → User B receives magic link → User B joins household",
  );

  test.todo(
    "After joining, User B sees the same recipes as User A",
  );

  test.todo(
    "User A (owner) can remove User B → User B loses access",
  );

  test.todo(
    "Invite link for wrong email shows error when logged in as different user",
  );

  test.todo(
    "Expired invite token shows friendly error message",
  );
});
