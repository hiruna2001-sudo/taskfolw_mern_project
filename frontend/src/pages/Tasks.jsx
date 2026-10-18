import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Pencil, Plus, Trash2, X } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import WorkspaceLayout from "../components/WorkspaceLayout";
import api from "../services/api";

const statuses = ["To Do", "In Progress", "Completed"];
const priorities = ["Low", "Medium", "High"];
const emptyTask = {
  title: "",
  description: "",
  project: "",
  assignedTo: "",
  status: "To Do",
  priority: "Medium",
  dueDate: "",
};

function errorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function formatDate(date) {
  if (!date) return "No due date";
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? "No due date"
    : parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

function idOf(person) {
  if (!person) return "";
  return person._id || person.id || person;
}

function projectPeople(project) {
  if (!project) return [];
  const people = [project.owner, ...(project.members || [])].filter(Boolean);
  return people.filter(
    (person, index) =>
      people.findIndex((candidate) => idOf(candidate) === idOf(person)) === index
  );
}

function statusStyle(status) {
  if (status === "Completed") return "bg-emerald-50 text-emerald-700";
  if (status === "In Progress") return "bg-sky-50 text-sky-700";
  return "bg-slate-100 text-slate-700";
}

function priorityStyle(priority) {
  if (priority === "High") return "bg-red-50 text-red-700";
  if (priority === "Low") return "bg-slate-100 text-slate-600";
  return "bg-amber-50 text-amber-700";
}

export default function Tasks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState(
    searchParams.get("project") || "All"
  );
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(emptyTask);
  const [saving, setSaving] = useState(false);

  async function loadWorkspace() {
    setLoading(true);
    setError("");
    try {
      const [projectResponse, taskResponse] = await Promise.all([
        api.get("/projects"),
        api.get("/tasks"),
      ]);
      setProjects(projectResponse.data.projects);
      setTasks(taskResponse.data.tasks);
    } catch (loadError) {
      setError(errorMessage(loadError, "Unable to load tasks."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkspace();
  }, []);

  useEffect(() => {
    const queryProject = searchParams.get("project") || "All";
    if (queryProject !== projectFilter) setProjectFilter(queryProject);
  }, [searchParams]);

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return tasks.filter((task) => {
      const matchesQuery =
        !normalizedQuery ||
        task.title.toLowerCase().includes(normalizedQuery) ||
        task.description?.toLowerCase().includes(normalizedQuery) ||
        task.project?.name?.toLowerCase().includes(normalizedQuery);
      return (
        matchesQuery &&
        (projectFilter === "All" || idOf(task.project) === projectFilter) &&
        (statusFilter === "All" || task.status === statusFilter)
      );
    });
  }, [tasks, query, projectFilter, statusFilter]);

  function openCreateForm() {
    const initialProject =
      projectFilter !== "All" ? projectFilter : projects[0]?._id || "";
    setEditingId("");
    setForm({ ...emptyTask, project: initialProject });
    setError("");
    setFormOpen(true);
  }

  function openEditForm(task) {
    setEditingId(task._id);
    setForm({
      title: task.title,
      description: task.description || "",
      project: idOf(task.project),
      assignedTo: idOf(task.assignedTo),
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingId("");
    setForm(emptyTask);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const payload = { ...form, dueDate: form.dueDate || "" };
    try {
      if (editingId) {
        const response = await api.patch(`/tasks/${editingId}`, payload);
        setTasks((current) =>
          current.map((task) =>
            task._id === editingId ? response.data.task : task
          )
        );
      } else {
        const response = await api.post("/tasks", payload);
        setTasks((current) => [response.data.task, ...current]);
      }
      setFormOpen(false);
      setEditingId("");
      setForm(emptyTask);
    } catch (saveError) {
      setError(errorMessage(saveError, "Unable to save task."));
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(task, status) {
    setError("");
    try {
      const response = await api.patch(`/tasks/${task._id}`, { status });
      setTasks((current) =>
        current.map((item) =>
          item._id === task._id ? response.data.task : item
        )
      );
    } catch (updateError) {
      setError(errorMessage(updateError, "Unable to update task status."));
    }
  }

  async function deleteTask(task) {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setError("");
    try {
      await api.delete(`/tasks/${task._id}`);
      setTasks((current) => current.filter((item) => item._id !== task._id));
    } catch (deleteError) {
      setError(errorMessage(deleteError, "Unable to delete task."));
    }
  }

  return (
    <WorkspaceLayout>
      <section aria-labelledby="tasks-heading">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-violet-700">WORKSPACE</p>
            <h1
              id="tasks-heading"
              className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
            >
              Tasks
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Keep priorities clear and make your next steps easy to find.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateForm}
            disabled={projects.length === 0}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            <Plus size={18} aria-hidden="true" />
            New task
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
                {editingId ? "Edit task" : "Create a task"}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close task form"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X size={19} aria-hidden="true" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Task title
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                  required
                  maxLength={200}
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  placeholder="Prepare project kickoff"
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
                  placeholder="Add useful details for this task"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Project
                <select
                  value={form.project}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      project: event.target.value,
                      assignedTo: "",
                    })
                  }
                  required
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="" disabled>
                    Select a project
                  </option>
                  {projects.map((project) => (
                    <option key={project._id} value={project._id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Assignee
                <select
                  value={form.assignedTo}
                  onChange={(event) =>
                    setForm({ ...form, assignedTo: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  <option value="">Unassigned</option>
                  {projectPeople(projects.find((item) => item._id === form.project)).map(
                    (person) => (
                      <option key={idOf(person)} value={idOf(person)}>
                        {person.name}
                      </option>
                    )
                  )}
                </select>
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
                  {statuses.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700">
                Priority
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({ ...form, priority: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                >
                  {priorities.map((priority) => (
                    <option key={priority}>{priority}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                Due date
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm({ ...form, dueDate: event.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 sm:max-w-sm"
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
                    : "Create task"}
              </button>
            </div>
          </form>
        )}

        {projects.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <label className="sr-only" htmlFor="task-search">
              Search tasks
            </label>
            <input
              id="task-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tasks..."
              className="min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <label className="sr-only" htmlFor="task-project-filter">
              Filter by project
            </label>
            <select
              id="task-project-filter"
              value={projectFilter}
              onChange={(event) => {
                const nextProject = event.target.value;
                setProjectFilter(nextProject);
                setSearchParams(
                  nextProject === "All" ? {} : { project: nextProject }
                );
              }}
              className="min-w-0 rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option value="All">All projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project._id}>
                  {project.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="task-status-filter">
              Filter by status
            </label>
            <select
              id="task-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            >
              <option>All</option>
              {statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Loading tasks...
          </p>
        ) : projects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <CheckSquare
              className="mx-auto text-violet-600"
              size={30}
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Create a project first
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Tasks belong to projects, so make a project before adding tasks.
            </p>
            <Link
              to="/projects"
              className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-violet-700"
            >
              Go to projects
            </Link>
          </div>
        ) : visibleTasks.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <CheckSquare
              className="mx-auto text-violet-600"
              size={30}
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {tasks.length ? "No matching tasks" : "No tasks yet"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {tasks.length
                ? "Try another search or choose a different filter."
                : "Add the first task to start making progress."}
            </p>
            {!tasks.length && (
              <button
                type="button"
                onClick={openCreateForm}
                className="mt-5 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
              >
                Create a task
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {visibleTasks.map((task) => (
              <article
                key={task._id}
                className="flex min-w-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="min-w-0 wrap-break-word text-base font-semibold text-slate-900">
                      {task.title}
                    </h2>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyle(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="mt-2 wrap-break-word text-sm leading-6 text-slate-600">
                      {task.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500 sm:text-sm">
                    <span className="max-w-full truncate">
                      {task.project?.name}
                    </span>
                    <span>Due: {formatDate(task.dueDate)}</span>
                    <span>
                      {task.assignedTo?.name
                        ? `Assigned to ${task.assignedTo.name}`
                        : "Unassigned"}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`status-${task._id}`}>
                    Status for {task.title}
                  </label>
                  <select
                    id={`status-${task._id}`}
                    value={task.status}
                    onChange={(event) =>
                      updateStatus(task, event.target.value)
                    }
                    className={`max-w-full rounded-lg border-0 px-3 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-violet-300 ${statusStyle(task.status)}`}
                  >
                    {statuses.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => openEditForm(task)}
                    aria-label={`Edit ${task.title}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={15} aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTask(task)}
                    aria-label={`Delete ${task.title}`}
                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </WorkspaceLayout>
  );
}
