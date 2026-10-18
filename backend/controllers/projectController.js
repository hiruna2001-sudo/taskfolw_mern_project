const mongoose = require("mongoose");
const Project = require("../models/Project");
const Task = require("../models/Task");

const projectStatuses = ["Planning", "In Progress", "Completed"];

function validId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function userProjectFilter(userId) {
  return { $or: [{ owner: userId }, { members: userId }] };
}

async function findAccessibleProject(projectId, userId) {
  if (!validId(projectId)) return null;

  return Project.findOne({
    _id: projectId,
    ...userProjectFilter(userId),
  });
}

function readProjectFields(body, { creating = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Provide project details." };
  }
  const fields = {};
  const allowed = ["name", "description", "status", "deadline"];

  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      fields[key] = body[key];
    }
  }

  if (creating && !Object.prototype.hasOwnProperty.call(fields, "name")) {
    return { error: "Project name is required." };
  }

  if (
    Object.prototype.hasOwnProperty.call(fields, "name") &&
    (typeof fields.name !== "string" ||
      !fields.name.trim() ||
      fields.name.trim().length > 150)
  ) {
    return { error: "Project name must be between 1 and 150 characters." };
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
    !projectStatuses.includes(fields.status)
  ) {
    return { error: "Choose a valid project status." };
  }

  if (Object.prototype.hasOwnProperty.call(fields, "deadline")) {
    if (fields.deadline === "") {
      fields.deadline = undefined;
    } else if (
      typeof fields.deadline !== "string" ||
      Number.isNaN(Date.parse(fields.deadline))
    ) {
      return { error: "Choose a valid project deadline." };
    }
  }

  if (typeof fields.name === "string") fields.name = fields.name.trim();
  return { fields };
}

exports.listProjects = async (req, res) => {
  try {
    const projects = await Project.find(userProjectFilter(req.user.id))
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ updatedAt: -1 });
    return res.json({ projects });
  } catch (error) {
    console.error("List projects error:", error.message);
    return res.status(500).json({ message: "Unable to load projects." });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await findAccessibleProject(req.params.projectId, req.user.id);
    if (!project) {
      return res.status(validId(req.params.projectId) ? 404 : 400).json({
        message: validId(req.params.projectId)
          ? "Project not found."
          : "Invalid project ID.",
      });
    }

    await project.populate([
      { path: "owner", select: "name email" },
      { path: "members", select: "name email" },
    ]);
    return res.json({ project });
  } catch (error) {
    console.error("Get project error:", error.message);
    return res.status(500).json({ message: "Unable to load project." });
  }
};

exports.createProject = async (req, res) => {
  const { fields, error } = readProjectFields(req.body, { creating: true });
  if (error) return res.status(400).json({ message: error });

  try {
    const project = await Project.create({
      ...fields,
      owner: req.user.id,
    });
    await project.populate("owner", "name email");
    return res.status(201).json({ project });
  } catch (createError) {
    console.error("Create project error:", createError.message);
    return res.status(500).json({ message: "Unable to create project." });
  }
};

exports.updateProject = async (req, res) => {
  const { fields, error } = readProjectFields(req.body);
  if (error) return res.status(400).json({ message: error });
  if (Object.keys(fields).length === 0) {
    return res.status(400).json({ message: "Provide at least one field to update." });
  }

  try {
    const project = await findAccessibleProject(req.params.projectId, req.user.id);
    if (!project) {
      return res.status(validId(req.params.projectId) ? 404 : 400).json({
        message: validId(req.params.projectId)
          ? "Project not found."
          : "Invalid project ID.",
      });
    }
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the project owner can edit it." });
    }

    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) project.set(key, undefined);
      else project.set(key, value);
    }
    await project.save();
    await project.populate([
      { path: "owner", select: "name email" },
      { path: "members", select: "name email" },
    ]);
    return res.json({ project });
  } catch (updateError) {
    console.error("Update project error:", updateError.message);
    return res.status(500).json({ message: "Unable to update project." });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await findAccessibleProject(req.params.projectId, req.user.id);
    if (!project) {
      return res.status(validId(req.params.projectId) ? 404 : 400).json({
        message: validId(req.params.projectId)
          ? "Project not found."
          : "Invalid project ID.",
      });
    }
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the project owner can delete it." });
    }

    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    return res.json({ message: "Project and its tasks were deleted." });
  } catch (error) {
    console.error("Delete project error:", error.message);
    return res.status(500).json({ message: "Unable to delete project." });
  }
};
