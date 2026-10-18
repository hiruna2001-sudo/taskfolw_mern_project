const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");

const router = express.Router();

router.use(protect);
router.route("/").get(listProjects).post(createProject);
router
  .route("/:projectId")
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);

module.exports = router;
