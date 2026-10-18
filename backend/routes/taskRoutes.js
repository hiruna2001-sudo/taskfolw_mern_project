const express = require("express");
const protect = require("../middleware/authMiddleware");
const {
  listTasks,
  createTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const router = express.Router();

router.use(protect);
router.route("/").get(listTasks).post(createTask);
router.route("/:taskId").patch(updateTask).delete(deleteTask);

module.exports = router;
