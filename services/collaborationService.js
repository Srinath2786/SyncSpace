const Activity = require("../models/Activity");

const getPresenceData = async ({ workspaceId, roomId }) => {
  const activities = await Activity.find({
    ...(workspaceId ? { workspace: workspaceId } : {}),
    ...(roomId ? { room: roomId } : {}),
  }).sort({ createdAt: -1 }).limit(20).populate("user", "name email avatar");

  return {
    onlineUsers: activities.map((activity) => activity.user).filter(Boolean),
    recentActivity: activities,
  };
};

const saveActivity = async ({ user, workspace, room, action, details }) => {
  return Activity.create({
    user,
    workspace,
    room,
    action,
    details,
  });
};

module.exports = {
  getPresenceData,
  saveActivity,
};
