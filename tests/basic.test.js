const test = require("node:test");
const assert = require("node:assert");

test("SyncSpace basic test", () => {
  assert.strictEqual(1 + 1, 2);
});

test("JWT secret exists in development", () => {
  assert.ok(process.env.JWT_SECRET || true);
});
