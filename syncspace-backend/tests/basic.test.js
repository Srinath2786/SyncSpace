const test = require("node:test");
const assert = require("node:assert");

test("SyncSpace basic test", () => {
  assert.strictEqual(1 + 1, 2);
});

test("JWT secret is loaded for the test environment", () => {
  assert.equal(typeof process.env.JWT_SECRET, "string");
  assert.ok(process.env.JWT_SECRET.length > 0);
});
