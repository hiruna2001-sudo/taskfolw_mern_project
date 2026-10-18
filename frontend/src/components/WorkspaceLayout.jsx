import {
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navigation = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/team", label: "Team", icon: Users },
];

export default function WorkspaceLayout({ children }) {
  const { user, logout } = useAuth();
  const userInitial = user?.name?.trim()?.charAt(0)?.toUpperCase() || "T";

  return (
    <div className="min-h-dvh bg-transparent">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 shadow-[0_4px_24px_-20px_rgba(15,23,42,0.35)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <Link
            to="/dashboard"
            className="flex min-w-0 items-center gap-3 rounded-lg text-slate-900 no-underline"
            aria-label="TaskFlow dashboard"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/20">
              <FolderKanban size={21} aria-hidden="true" />
            </span>
            <span>
              <span className="block truncate text-lg font-bold tracking-tight sm:text-xl">
                TaskFlow
              </span>
              <span className="hidden text-[11px] font-medium tracking-wide text-slate-500 sm:block">
                TEAM WORKSPACE
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user?.name}
              </p>
              <p className="max-w-52 truncate text-xs text-slate-500">
                {user?.email}
              </p>
            </div>
            <span
              aria-hidden="true"
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-indigo-100 text-sm font-bold text-violet-800 ring-1 ring-violet-200 sm:flex"
            >
              {userInitial}
            </span>
            <button
              type="button"
              onClick={logout}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-800 sm:px-4"
            >
              <LogOut size={16} aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>

          <nav
            aria-label="Workspace"
            className="flex w-full min-w-0 gap-1 overflow-x-auto border-t border-slate-100 pt-2 sm:gap-2 sm:pt-3"
          >
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-violet-600 text-white shadow-sm shadow-violet-600/20"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                <Icon size={17} aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
        {children}
      </main>
    </div>
  );
}
