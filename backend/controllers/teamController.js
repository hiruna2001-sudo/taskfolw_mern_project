const mongoose = require("mongoose");
const Project = require("../models/Project");
const User = require("../models/User");

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

async function sendPopulatedProject(res, project, status = 200) {
  await project.populate([
    { path: "owner", select: "name email" },
    { path: "members", select: "name email" },
  ]);
  return res.status(status).json({ project });
}

exports.listTeams = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user.id }, { members: req.user.id }],
    })
      .populate("owner", "name email")
      .populate("members", "name email")
      .sort({ name: 1 });
    return res.json({ projects });
  } catch (error) {
    console.error("List teams error:", error.message);
    return res.status(500).json({ message: "Unable to load project teams." });
  }
};

exports.addTeamMember = async (req, res) => {
  const email =
    req.body &&
    typeof req.body === "object" &&
    typeof req.body.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: "Enter a valid registered email." });
  }

  try {
    const project = await findAccessibleProject(
      req.params.projectId,
      req.user.id
    );
    if (!project) {
      return res.status(validId(req.params.projectId) ? 404 : 400).json({
        message: validId(req.params.projectId)
          ? "Project not found."
          : "Invalid project ID.",
      });
    }
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the project owner can manage its team.",
      });
    }

    const member = await User.findOne({ email }).select("name email");
    if (!member) {
      return res.status(404).json({
        message: "No registered user was found with that email.",
      });
    }
    if (member._id.toString() === req.user.id) {
      return res.status(400).json({ message: "You already own this project." });
    }
    if (project.members.some((id) => id.toString() === member._id.toString())) {
      return res.status(409).json({ message: "This person is already on the team." });
    }

    project.members.push(member._id);
    await project.save();
    return sendPopulatedProject(res, project, 200);
  } catch (error) {
    console.error("Add team member error:", error.message);
    return res.status(500).json({ message: "Unable to add team member." });
  }
};

exports.removeTeamMember = async (req, res) => {
  if (!validId(req.params.memberId)) {
    return res.status(400).json({ message: "Invalid team member ID." });
  }

  try {
    const project = await findAccessibleProject(
      req.params.projectId,
      req.user.id
    );
    if (!project) {
      return res.status(validId(req.params.projectId) ? 404 : 400).json({
        message: validId(req.params.projectId)
          ? "Project not found."
          : "Invalid project ID.",
      });
    }
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Only the project owner can manage its team.",
      });
    }

    const memberIndex = project.members.findIndex(
      (id) => id.toString() === req.params.memberId
    );
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Team member not found." });
    }

    project.members.splice(memberIndex, 1);
    await project.save();
    return sendPopulatedProject(res, project);
  } catch (error) {
    console.error("Remove team member error:", error.message);
    return res.status(500).json({ message: "Unable to remove team member." });
  }
};
