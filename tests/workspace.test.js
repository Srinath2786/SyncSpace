const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../app");
const User = require("../models/User");
const Workspace = require("../models/Workspace");

const uniqueEmail = () => `ws_${Date.now()}_${Math.random().toString(16).slice(2)}@test.com`;

const requestTo = async (path, options = {}) => {
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const { port } = server.address();

  try {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
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

const createUser = async () => {
  const email = uniqueEmail();
  const registerRes = await requestTo("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Workspace User",
      email,
      password: "Test@12345",
    }),
  });

  return {
    email,
    token: registerRes.body.token,
    userId: registerRes.body.user.id,
  };
};

test("GET /api/workspaces returns the current user workspaces", async () => {
  const user = await createUser();

  const createRes = await requestTo("/api/workspaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({
      name: "Marketing Team",
      description: "Shared workspace for campaigns",
    }),
  });

  assert.equal(createRes.status, 201);

  const listRes = await requestTo("/api/workspaces", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  assert.equal(listRes.status, 200);
  assert.ok(listRes.body.workspaces.length >= 1);

  await Workspace.deleteMany({ owner: user.userId });
  await User.deleteOne({ _id: user.userId });
});

test("PUT /api/workspaces/:workspaceId updates workspace details", async () => {
  const user = await createUser();

  const createRes = await requestTo("/api/workspaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({
      name: "Operations",
      description: "Ops board",
    }),
  });

  const workspaceId = createRes.body.workspace._id;

  const updateRes = await requestTo(`/api/workspaces/${workspaceId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({
      name: "Operations Updated",
      description: "Updated operations board",
    }),
  });

  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.workspace.name, "Operations Updated");

  await Workspace.deleteOne({ _id: workspaceId });
  await User.deleteOne({ _id: user.userId });
});
