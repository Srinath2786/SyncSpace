const Workspace = require("../models/Workspace");
const {
  createWorkspace: createWorkspaceService,
  getWorkspaceById,
  updateWorkspace: updateWorkspaceService,
  deleteWorkspace: deleteWorkspaceService,
  addWorkspaceMember,
  removeWorkspaceMember,
} = require("../services/workspaceService");
const { sendSuccess, sendError } = require("../utils/apiResponse");

const createWorkspace = async (req, res, next) => {
  try {
    const workspace = await createWorkspaceService({
      name: req.body.name,
      description: req.body.description,
      ownerId: req.user._id,
    });

    return sendSuccess(res, 201, {
      message: "Workspace created successfully",
      workspace,
    });
  } catch (error) {
    return next(error);
  }
};

const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ members: req.user._id }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, { workspaces });
  } catch (error) {
    return next(error);
  }
};

const getWorkspaceDetails = async (req, res, next) => {
  try {
    const workspace = await getWorkspaceById(req.params.workspaceId);

    if (!workspace) {
      return sendError(res, 404, "Workspace not found");
    }

    const isMember = workspace.members.some((member) => member._id.toString() === req.user._id.toString());
    if (!isMember) {
      return sendError(res, 403, "You are not a member of this workspace");
    }

    return sendSuccess(res, 200, { workspace });
  } catch (error) {
    return next(error);
  }
};

const updateWorkspace = async (req, res, next) => {
  try {
    const workspace = await updateWorkspaceService({
      workspaceId: req.params.workspaceId,
      userId: req.user._id,
      updates: req.body,
    });

    return sendSuccess(res, 200, {
      message: "Workspace updated successfully",
      workspace,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteWorkspace = async (req, res, next) => {
  try {
    await deleteWorkspaceService({
      workspaceId: req.params.workspaceId,
      userId: req.user._id,
    });

    return sendSuccess(res, 200, {
      message: "Workspace deleted successfully",
    });
  } catch (error) {
    return next(error);
  }
};

const addMember = async (req, res, next) => {
  try {
    const workspace = await addWorkspaceMember({
      workspaceId: req.params.workspaceId,
      userId: req.user._id,
      memberEmail: req.body.email,
    });

    return sendSuccess(res, 200, {
      message: "Member added successfully",
      workspace,
    });
  } catch (error) {
    return next(error);
  }
};

const removeMember = async (req, res, next) => {
  try {
    const workspace = await removeWorkspaceMember({
      workspaceId: req.params.workspaceId,
      userId: req.user._id,
      targetUserId: req.params.userId,
    });

    return sendSuccess(res, 200, {
      message: "Member removed successfully",
      workspace,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceDetails,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
};