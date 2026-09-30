const Workspace = require("../models/Workspace");
const User = require("../models/User");

const getWorkspaceById = async (workspaceId) => {
  return Workspace.findById(workspaceId).populate("members", "name email avatar");
};

const createWorkspace = async ({ name, description, ownerId }) => {
  return Workspace.create({
    name: String(name).trim(),
    description: description ? String(description).trim() : "",
    owner: ownerId,
    members: [ownerId],
  });
};

const updateWorkspace = async ({ workspaceId, userId, updates }) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.owner.toString() !== userId.toString()) {
    const error = new Error("Only the workspace owner can update this workspace");
    error.statusCode = 403;
    throw error;
  }

  if (updates.name) workspace.name = String(updates.name).trim();
  if (updates.description !== undefined) workspace.description = String(updates.description).trim();

  await workspace.save();
  return workspace;
};

const deleteWorkspace = async ({ workspaceId, userId }) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.owner.toString() !== userId.toString()) {
    const error = new Error("Only the workspace owner can delete this workspace");
    error.statusCode = 403;
    throw error;
  }

  await workspace.deleteOne();
  return workspace;
};

const addWorkspaceMember = async ({ workspaceId, userId, memberEmail }) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.owner.toString() !== userId.toString()) {
    const error = new Error("Only the workspace owner can manage members");
    error.statusCode = 403;
    throw error;
  }

  const member = await User.findOne({ email: String(memberEmail).trim().toLowerCase() });

  if (!member) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.members.some((memberId) => memberId.toString() === member._id.toString())) {
    const error = new Error("User is already a workspace member");
    error.statusCode = 409;
    throw error;
  }

  workspace.members.push(member._id);
  await workspace.save();
  return workspace.populate("members", "name email avatar");
};

const removeWorkspaceMember = async ({ workspaceId, userId, targetUserId }) => {
  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  if (workspace.owner.toString() !== userId.toString()) {
    const error = new Error("Only the workspace owner can manage members");
    error.statusCode = 403;
    throw error;
  }

  if (workspace.owner.toString() === targetUserId.toString()) {
    const error = new Error("Owner cannot be removed from the workspace");
    error.statusCode = 400;
    throw error;
  }

  workspace.members = workspace.members.filter(
    (memberId) => memberId.toString() !== targetUserId.toString()
  );

  await workspace.save();
  return workspace.populate("members", "name email avatar");
};

module.exports = {
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addWorkspaceMember,
  removeWorkspaceMember,
};
