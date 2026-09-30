const test = require("node:test");
const assert = require("node:assert/strict");

const app = require("../app");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const Room = require("../models/Room");

const uniqueEmail = () => `room_${Date.now()}_${Math.random().toString(16).slice(2)}@test.com`;

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
      name: "Room User",
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

test("POST /api/rooms creates a room and GET /api/rooms/:roomId returns it", async () => {
  const user = await createUser();

  const workspaceRes = await requestTo("/api/workspaces", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({
      name: "Room Workspace",
      description: "Testing rooms",
    }),
  });

  const workspaceId = workspaceRes.body.workspace._id;

  const roomRes = await requestTo("/api/rooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify({
      name: "Frontend Room",
      workspaceId,
      language: "javascript",
    }),
  });

  assert.equal(roomRes.status, 201);
  assert.equal(roomRes.body.room.name, "Frontend Room");

  const roomDetails = await requestTo(`/api/rooms/${roomRes.body.room._id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.token}`,
    },
  });

  assert.equal(roomDetails.status, 200);
  assert.equal(roomDetails.body.room.name, "Frontend Room");

  await Room.deleteOne({ _id: roomRes.body.room._id });
  await Workspace.deleteOne({ _id: workspaceId });
  await User.deleteOne({ _id: user.userId });
});
