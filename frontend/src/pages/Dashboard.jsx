
import {
  CheckSquare,
  FolderKanban,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import WorkspaceLayout from "../components/WorkspaceLayout";

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0] || "there";

  return (
    <WorkspaceLayout>
      <div>
        <section className="overflow-hidden rounded-3xl bg-linear-to-br from-violet-700 via-violet-600 to-indigo-600 p-6 text-white shadow-lg shadow-violet-950/10 sm:p-9 lg:p-12">
          <p className="text-sm font-semibold text-violet-100">
            YOUR WORKSPACE
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            Welcome, {firstName}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-violet-100 sm:text-base sm:leading-7">
            Keep projects organized, turn plans into clear next steps, and make
            it easier for your team to work together.
          </p>
        </section>

        <section className="mt-8 sm:mt-10" aria-labelledby="workspace-heading">
          <div className="mb-4 flex flex-col gap-1 sm:mb-5">
            <h2
              id="workspace-heading"
              className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl"
            >
              Your workspace
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Everything you need to keep work moving, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            <Link to="/projects" className="flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <FolderKanban size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Projects
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                Bring related work together and keep project goals in view.
              </p>
              <span className="mt-4 text-sm font-semibold text-violet-700">
                Keep work organized
              </span>
            </Link>

            <Link to="/tasks" className="flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckSquare size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Tasks
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                Track priorities and turn plans into manageable steps.
              </p>
              <span className="mt-4 text-sm font-semibold text-violet-700">
                Make progress visible
              </span>
            </Link>

            <Link to="/team" className="flex min-h-48 flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left no-underline shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md sm:col-span-2 sm:p-6 lg:col-span-1">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Users size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Team
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
                Keep everyone aligned as you collaborate on shared work.
              </p>
              <span className="mt-4 text-sm font-semibold text-violet-700">
                Stay connected
              </span>
            </Link>
          </div>
        </section>

        <p className="mt-8 wrap-break-word text-center text-xs text-slate-500 sm:mt-10 sm:text-sm">
          Signed in as {user?.email}
        </p>
      </div>
    </WorkspaceLayout>
  );
}
