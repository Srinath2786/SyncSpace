const Invitation = require("../models/Invitation");
const Workspace = require("../models/Workspace");
const Room = require("../models/Room");
const User = require("../models/User");

const createInvitation = async ({
  workspaceId,
  roomId,
  invitedBy,
  email,
}) => {
  const user = await User.findOne({
    email: String(email).trim().toLowerCase(),
  });

  if (!user) {
    const error = new Error("Invited user not found");
    error.statusCode = 404;
    throw error;
  }

  const workspace = await Workspace.findById(workspaceId);

  if (!workspace) {
    const error = new Error("Workspace not found");
    error.statusCode = 404;
    throw error;
  }

  const isMember = workspace.members.some(
    (memberId) => memberId.toString() === invitedBy.toString()
  );

  if (!isMember) {
    const error = new Error("You are not a workspace member");
    error.statusCode = 403;
    throw error;
  }

  const invitation = await Invitation.create({
    workspace: workspaceId,
    room: roomId || null,
    invitedBy,
    invitedUser: user._id,
  });

  return invitation;
};

const acceptInvitation = async (invitationId, userId) => {
  const invitation = await Invitation.findById(invitationId);

  if (!invitation) {
    const error = new Error("Invitation not found");
    error.statusCode = 404;
    throw error;
  }

  if (invitation.invitedUser.toString() !== userId.toString()) {
    const error = new Error("You cannot accept this invitation");
    error.statusCode = 403;
    throw error;
  }

  if (invitation.status !== "pending") {
    const error = new Error("Invitation is no longer pending");
    error.statusCode = 400;
    throw error;
  }

  const workspace = await Workspace.findById(invitation.workspace);

  if (workspace && !workspace.members.some((id) => id.toString() === userId.toString())) {
    workspace.members.push(userId);
    await workspace.save();
  }

  if (invitation.room) {
    const room = await Room.findById(invitation.room);

    if (room && !room.members.some((id) => id.toString() === userId.toString())) {
      room.members.push(userId);
      await room.save();
    }
  }

  invitation.status = "accepted";
  await invitation.save();

  return invitation;
};

module.exports = {
  createInvitation,
  acceptInvitation,
};
