const { sendSuccess } = require("../utils/apiResponse");
const { getPresenceData } = require("../services/collaborationService");

const getPresence = async (req, res) => {
  const { workspaceId, roomId } = req.query;
  const data = await getPresenceData({ workspaceId, roomId });

  return sendSuccess(res, 200, {
    presence: data,
  });
};

module.exports = {
  getPresence,
};
