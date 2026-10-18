const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");

const taskStatuses = ["To Do", "In Progress", "Completed"];
const priorities = ["Low", "Medium", "High"];

function validId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function findAccessibleProject(projectId, userId) {
  if (!validId(projectId)) return null;
  return Project.findOne({
    _id: projectId,
    $or: [{ owner: userId }, { members: userId }],
  });
}

function readTaskFields(body, { creating = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Provide task details." };
  }
  const fields = {};
  const allowed = [
    "title",
    "description",
    "project",
    "assignedTo",
    "status",
    "priority",
    "dueDate",
  ];
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) fields[key] = body[key];
  }

  if (creating && !fields.title) return { error: "Task title is required." };
  if (
    Object.prototype.hasOwnProperty.call(fields, "title") &&
    (typeof fields.title !== "string" ||
      !fields.title.trim() ||
      fields.title.trim().length > 200)
  ) {
    return { error: "Task title must be between 1 and 200 characters." };
  }
  if (
    Object.prototype.hasOwnProperty.call(fields, "description") &&
    (typeof fields.description !== "string" ||
      fields.description.length > 2000)
  ) {
    return { error: "Description must be 2000 characters or fewer." };
  }
  if (
    Object.prototype.hasOwnProperty.call(fields, "status") &&
    !taskStatuses.includes(fields.status)
  ) {
    return { error: "Choose a valid task status." };
  }
  if (
    Object.prototype.hasOwnProperty.call(fields, "priority") &&
    !priorities.includes(fields.priority)
  ) {
    return { error: "Choose a valid task priority." };
  }
  if (
    Object.prototype.hasOwnProperty.call(fields, "project") &&
    (typeof fields.project !== "string" || !validId(fields.project))
  ) {
    return { error: "Choose a valid project." };
  }
  if (Object.prototype.hasOwnProperty.call(fields, "assignedTo")) {
    if (fields.assignedTo === "") fields.assignedTo = null;
    else if (typeof fields.assignedTo !== "string" || !validId(fields.assignedTo)) {
      return { error: "Choose a valid team member." };
    }
  }
  if (Object.prototype.hasOwnProperty.call(fields, "dueDate")) {
    if (fields.dueDate === "") fields.dueDate = undefined;
    else if (
      typeof fields.dueDate !== "string" ||
      Number.isNaN(Date.parse(fields.dueDate))
    ) {
      return { error: "Choose a valid due date." };
    }
  }
  if (typeof fields.title === "string") fields.title = fields.title.trim();
  return { fields };
}

async function validateTaskProject(fields, userId, currentProjectId) {
  const projectId = fields.project || currentProjectId;
  const project = await findAccessibleProject(projectId, userId);
  if (!project) return { error: "Select a project you belong to." };

  if (
    Object.prototype.hasOwnProperty.call(fields, "assignedTo") &&
    fields.assignedTo
  ) {
    const isMember =
      project.owner.toString() === fields.assignedTo ||
      project.members.some((memberId) => memberId.toString() === fields.assignedTo);
    if (!isMember) return { error: "Assignee must belong to the selected project." };
  }
  return { project };
}

exports.listTasks = async (req, res) => {
  try {
    const filter = {};
    if (req.query.project) {
      const project = await findAccessibleProject(req.query.project, req.user.id);
      if (!project) {
        return res.status(validId(req.query.project) ? 404 : 400).json({
          message: validId(req.query.project)
            ? "Project not found."
            : "Invalid project ID.",
        });
      }
      filter.project = project._id;
    } else {
      const accessibleProjects = await Project.find({
        $or: [{ owner: req.user.id }, { members: req.user.id }],
      }).select("_id");
      filter.project = { $in: accessibleProjects.map(({ _id }) => _id) };
    }

    const tasks = await Task.find(filter)
      .populate("project", "name")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name email")
      .sort({ updatedAt: -1 });
    return res.json({ tasks });
  } catch (error) {
    console.error("List tasks error:", error.message);
    return res.status(500).json({ message: "Unable to load tasks." });
  }
};

exports.createTask = async (req, res) => {
  const { fields, error } = readTaskFields(req.body, { creating: true });
  if (error) return res.status(400).json({ message: error });
  if (!fields.project) {
    return res.status(400).json({ message: "Choose a project for this task." });
  }

  try {
    const projectResult = await validateTaskProject(fields, req.user.id);
    if (projectResult.error) {
      return res.status(400).json({ message: projectResult.error });
    }
    const task = await Task.create({
      ...fields,
      project: projectResult.project._id,
      createdBy: req.user.id,
    });
    await task.populate([
      { path: "project", select: "name" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);
    return res.status(201).json({ task });
  } catch (createError) {
    console.error("Create task error:", createError.message);
    return res.status(500).json({ message: "Unable to create task." });
  }
};

exports.updateTask = async (req, res) => {
  const { fields, error } = readTaskFields(req.body);
  if (error) return res.status(400).json({ message: error });
  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ message: "Provide at least one field to update." });
  }
  if (!validId(req.params.taskId)) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });

    const currentProject = await findAccessibleProject(task.project, req.user.id);
    if (!currentProject) return res.status(404).json({ message: "Task not found." });

    const validationFields = { ...fields };
    if (
      Object.prototype.hasOwnProperty.call(fields, "project") &&
      !Object.prototype.hasOwnProperty.call(fields, "assignedTo")
    ) {
      validationFields.assignedTo = task.assignedTo?.toString() || null;
    }
    const projectResult = await validateTaskProject(
      validationFields,
      req.user.id,
      task.project.toString()
    );
    if (projectResult.error) {
      return res.status(400).json({ message: projectResult.error });
    }

    for (const [key, value] of Object.entries(fields)) {
      if (key === "project") task.project = projectResult.project._id;
      else if (value === undefined) task.set(key, undefined);
      else task.set(key, value);
    }
    await task.save();
    await task.populate([
      { path: "project", select: "name" },
      { path: "assignedTo", select: "name email" },
      { path: "createdBy", select: "name email" },
    ]);
    return res.json({ task });
  } catch (updateError) {
    console.error("Update task error:", updateError.message);
    return res.status(500).json({ message: "Unable to update task." });
  }
};

exports.deleteTask = async (req, res) => {
  if (!validId(req.params.taskId)) {
    return res.status(400).json({ message: "Invalid task ID." });
  }

  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: "Task not found." });
    const project = await findAccessibleProject(task.project, req.user.id);
    if (!project) return res.status(404).json({ message: "Task not found." });

    await task.deleteOne();
    return res.json({ message: "Task deleted." });
  } catch (error) {
    console.error("Delete task error:", error.message);
    return res.status(500).json({ message: "Unable to delete task." });
  }
};
