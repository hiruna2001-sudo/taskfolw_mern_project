import { useEffect, useMemo, useState } from "react";
import { FolderKanban, Pencil, Plus, Trash2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceLayout from "../components/WorkspaceLayout";
import api from "../services/api";

const emptyProject = {
  name: "",
  description: "",
  status: "Planning",
  deadline: "",
};
const projectStatuses = ["Planning", "In Progress", "Completed"];

function errorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function formatDate(date) {
  if (!date) return "No deadline";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "No deadline"
    : parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function ownerId(owner) {
  return owner?._id || owner?.id || owner;
}

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyProject);
  const [saving, setSaving] = useState(false);

  async function loadProjects() {
    setError("");
    setLoading(true);
    try {
      const response = await api.get("/projects");
      setProjects(response.data.projects);
    } catch (loadError) {
      setError(errorMessage(loadError, "Unable to load projects."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const visibleProjects = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        !normalizedQuery ||
        project.name.toLowerCase().includes(normalizedQuery) ||
        project.description?.toLowerCase().includes(normalizedQuery);
      return (
        matchesQuery &&
        (statusFilter === "All" || project.status === statusFilter)
      );
    });
  }, [projects, query, statusFilter]);

  function openCreateForm() {
    setEditingId("");
    setForm(emptyProject);
    setError("");
    setFormOpen(true);
  }

  function openEditForm(project) {
    setEditingId(project._id);
    setForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
      deadline: project.deadline ? project.deadline.slice(0, 10) : "",
    });
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingId("");
    setForm(emptyProject);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const payload = { ...form, deadline: form.deadline || "" };
    try {
      if (editingId) {
        const response = await api.patch(`/projects/${editingId}`, payload);
        setProjects((current) =>
          current.map((project) =>
            project._id === editingId ? response.data.project : project
          )
        );
      } else {
        const response = await api.post("/projects", payload);
        setProjects((current) => [response.data.project, ...current]);
      }
      setFormOpen(false);
      setEditingId("");
      setForm(emptyProject);
    } catch (saveError) {
      setError(errorMessage(saveError, "Unable to save project."));
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject(project) {
    if (
      !window.confirm(
        `Delete "${project.name}" and all of its tasks? This cannot be undone.`
      )
    ) {
      return;
    }
    setError("");
    try {
      await api.delete(`/projects/${project._id}`);
      setProjects((current) =>
        current.filter((item) => item._id !== project._id)
      );
    } catch (deleteError) {
      setError(errorMessage(deleteError, "Unable to delete project."));
    }
  }

  return (
    <WorkspaceLayout>
      <section aria-labelledby="projects-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-violet-700">WORKSPACE</p>
            <h1
              id="projects-heading"
              className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Projects
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Plan work, set deadlines, and keep each project moving forward.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 sm:w-auto"
          >
            <Plus size={18} aria-hidden="true" />
            New project
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        {formOpen && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 rounded-2xl border border-violet-200 bg-white p-4 shadow-sm sm:p-6"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit project" : "Create a project"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close project form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Project name
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  required
                  maxLength={150}
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="Website redesign"
                />
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Description
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  maxLength={2000}
                  rows={3}
                  className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="What does this project aim to achieve?"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({ ...form, status: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  {projectStatuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Deadline
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(event) =>
                    setForm({ ...form, deadline: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create project"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor="project-search">
            Search projects
          </label>
          <input
            id="project-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects..."
            className="min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
          <label className="sr-only" htmlFor="project-status-filter">
            Filter by status
          </label>
          <select
            id="project-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          >
            <option>All</option>
            {projectStatuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Loading projects...
          </p>
        ) : visibleProjects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <FolderKanban
              className="mx-auto text-violet-600"
              size={30}
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {projects.length ? "No matching projects" : "No projects yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
              {projects.length
                ? "Try a different search or status filter."
                : "Create your first project to give your work a shared home."}
            </p>
            {!projects.length && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Create a project
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleProjects.map((project) => {
              const isOwner = ownerId(project.owner) === (user?.id || user?._id);
              return (
                <article
                  key={project._id}
                  className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                      <FolderKanban size={21} aria-hidden="true" />
                    </span>
                    <span className="max-w-[55%] truncate rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {project.status}
                    </span>
                  </div>
                  <h2 className="mt-4 wrap-break-word text-lg font-bold text-slate-900">
                    {project.name}
                  </h2>
                  <p className="mt-2 min-h-12 wrap-break-word text-sm leading-6 text-slate-600">
                    {project.description || "No description added."}
                  </p>
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                    <p>Deadline: {formatDate(project.deadline)}</p>
                    <p>
                      Team: {(project.members?.length || 0) + 1}{" "}
                      {(project.members?.length || 0) === 0 ? "person" : "people"}
                    </p>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      to={`/tasks?project=${project._id}`}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 no-underline hover:bg-violet-100"
                    >
                      View tasks
                    </Link>
                    {isOwner && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditForm(project)}
                          aria-label={`Edit ${project.name}`}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Pencil size={15} aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteProject(project)}
                          aria-label={`Delete ${project.name}`}
                          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </WorkspaceLayout>
  );
}
