const express = require("express");
const {
  createWorkspace,
  getWorkspaces,
  getWorkspaceDetails,
  updateWorkspace,
  deleteWorkspace,
  addMember,
  removeMember,
} = require("../controllers/workspaceController");
const protect = require("../middleware/authMiddleware");
const { validateWorkspaceBody } = require("../validators/workspaceValidator");

const router = express.Router();

router.get("/", protect, getWorkspaces);
router.post("/", protect, validateWorkspaceBody, createWorkspace);
router.get("/:workspaceId", protect, getWorkspaceDetails);
router.put("/:workspaceId", protect, validateWorkspaceBody, updateWorkspace);
router.delete("/:workspaceId", protect, deleteWorkspace);
router.post("/:workspaceId/members", protect, addMember);
router.delete("/:workspaceId/members/:userId", protect, removeMember);

module.exports = router;