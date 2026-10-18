const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  listTeams,
  addTeamMember,
  removeTeamMember,
} = require("../controllers/teamController");

const router = express.Router();

router.use(protect);
router.get("/", listTeams);
router.post("/:projectId/members", addTeamMember);
router.delete("/:projectId/members/:memberId", removeTeamMember);

module.exports = router;
