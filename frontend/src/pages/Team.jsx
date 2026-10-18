import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserMinus, Users } from "lucide-react";
import WorkspaceLayout from "../components/WorkspaceLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function errorMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

function idOf(person) {
  if (!person) return "";
  return person._id || person.id || person;
}

function initials(name) {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

export default function Team() {
  const { user } = useAuth();
  const currentUserId = user?.id || user?._id;
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadTeams() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/team");
      const loadedProjects = response.data.projects;
      setProjects(loadedProjects);
      setSelectedProjectId((current) =>
        loadedProjects.some((project) => project._id === current)
          ? current
          : loadedProjects[0]?._id || ""
      );
    } catch (loadError) {
      setError(errorMessage(loadError, "Unable to load project teams."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTeams();
  }, []);

  const project = useMemo(
    () => projects.find((item) => item._id === selectedProjectId),
    [projects, selectedProjectId]
  );
  const isOwner =
    project && idOf(project.owner) === currentUserId;
  const members = useMemo(() => {
    if (!project) return [];
    const owner =
      project.owner && typeof project.owner === "object"
        ? [{ ...project.owner, role: "Owner" }]
        : [];
    const projectMembers = (project.members || []).map((member) => ({
      ...member,
      role: "Member",
    }));
    return [...owner, ...projectMembers];
  }, [project]);

  async function handleAdd(event) {
    event.preventDefault();
    if (!project) return;
    setError("");
    setNotice("");
    setAdding(true);
    try {
      const response = await api.post(`/team/${project._id}/members`, {
        email,
      });
      setProjects((current) =>
        current.map((item) =>
          item._id === project._id ? response.data.project : item
        )
      );
      setEmail("");
      setNotice("Team member added.");
    } catch (addError) {
      setError(errorMessage(addError, "Unable to add team member."));
    } finally {
      setAdding(false);
    }
  }

  async function removeMember(member) {
    if (!project) return;
    if (!window.confirm(`Remove ${member.name} from ${project.name}?`)) return;
    setError("");
    setNotice("");
    try {
      const response = await api.delete(
        `/team/${project._id}/members/${idOf(member)}`
      );
      setProjects((current) =>
        current.map((item) =>
          item._id === project._id ? response.data.project : item
        )
      );
      setNotice(`${member.name} was removed from the project team.`);
    } catch (removeError) {
      setError(errorMessage(removeError, "Unable to remove team member."));
    }
  }

  return (
    <WorkspaceLayout>
      <section aria-labelledby="team-heading">
        <div>
          <p className="text-sm font-semibold text-violet-700">WORKSPACE</p>
          <h1
            id="team-heading"
            className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
          >
            Team
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            See who is working together on each project and manage project
            membership.
          </p>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        {notice && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}

        {loading ? (
          <p className="py-12 text-center text-sm text-slate-500">
            Loading teams...
          </p>
        ) : projects.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <Users
              className="mx-auto text-violet-600"
              size={30}
              aria-hidden="true"
            />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Create a project to start a team
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Each project has its own team. Add registered users to collaborate.
            </p>
            <Link
              to="/projects"
              className="mt-5 inline-flex rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white no-underline hover:bg-violet-700"
            >
              Go to projects
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
            <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <label
                htmlFor="team-project"
                className="block text-sm font-semibold text-slate-800"
              >
                Project
              </label>
              <select
                id="team-project"
                value={selectedProjectId}
                onChange={(event) => {
                  setSelectedProjectId(event.target.value);
                  setError("");
                  setNotice("");
                }}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                {projects.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>

              {project && (
                <>
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Project status
                    </p>
                    <p className="mt-1 wrap-break-word font-semibold text-slate-900">
                      {project.status}
                    </p>
                    {project.description && (
                      <p className="mt-2 wrap-break-word text-sm leading-6 text-slate-600">
                        {project.description}
                      </p>
                    )}
                  </div>

                  {isOwner ? (
                    <form onSubmit={handleAdd} className="mt-5">
                      <label
                        htmlFor="member-email"
                        className="block text-sm font-semibold text-slate-800"
                      >
                        Add an existing user
                      </label>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        They must already have a TaskFlow account.
                      </p>
                      <input
                        id="member-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="teammate@example.com"
                        className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                      />
                      <button
                        type="submit"
                        disabled={adding}
                        className="mt-3 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                      >
                        {adding ? "Adding..." : "Add to project"}
                      </button>
                    </form>
                  ) : (
                    <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                      Only the project owner can add or remove team members.
                    </p>
                  )}
                </>
              )}
            </aside>

            <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-1 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {project?.name} team
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {members.length} {members.length === 1 ? "person" : "people"}
                  </p>
                </div>
              </div>

              {members.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  No team members have been added yet.
                </p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <li
                      key={idOf(member)}
                      className="flex min-w-0 items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6"
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                        {initials(member.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {member.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 sm:text-sm">
                          {member.email}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {member.role}
                      </span>
                      {isOwner && member.role !== "Owner" && (
                        <button
                          type="button"
                          onClick={() => removeMember(member)}
                          aria-label={`Remove ${member.name} from team`}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <UserMinus size={17} aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </WorkspaceLayout>
  );
}
