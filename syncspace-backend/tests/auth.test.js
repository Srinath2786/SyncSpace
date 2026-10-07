const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../app");
const User = require("../models/User");

const uniqueEmail = () => `auth_${Date.now()}_${Math.random().toString(16).slice(2)}@test.com`;

const requestTo = async (path, options = {}) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    return {
      status: res.status,
      body: text ? JSON.parse(text) : {},
    };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
};

test("POST /api/auth/register creates a user and returns a token", async () => {
  const email = uniqueEmail();

  const res = await requestTo("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Auth Tester",
      email,
      password: "Test@12345",
    }),
  });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.token);
  assert.equal(res.body.user.email, email);

  await User.deleteOne({ email });
});

test("POST /api/auth/login authenticates an existing user", async () => {
  const email = uniqueEmail();
  await requestTo("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Login User",
      email,
      password: "Test@12345",
    }),
  });

  const loginRes = await requestTo("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: "Test@12345",
    }),
  });

  assert.equal(loginRes.status, 200);
  assert.equal(loginRes.body.success, true);
  assert.ok(loginRes.body.token);

  await User.deleteOne({ email });
});

test("POST /api/auth/register validates required fields", async () => {
  const res = await requestTo("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Bad User",
      email: "not-an-email",
      password: "123",
    }),
  });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(Array.isArray(res.body.details));
});
