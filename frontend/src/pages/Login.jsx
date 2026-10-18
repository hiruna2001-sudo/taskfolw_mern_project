
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Check,
  FolderKanban,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to log in. Try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page flex min-h-dvh items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
      <section className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_30px_90px_-38px_rgba(38,28,76,0.32)] lg:min-h-[680px] lg:grid-cols-[1.02fr_0.98fr]">
        <aside className="auth-visual relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex xl:p-14">
          <div className="relative z-10 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur">
              <FolderKanban size={22} aria-hidden="true" />
            </span>
            <span className="text-xl font-bold tracking-tight">TaskFlow</span>
          </div>

          <div className="relative z-10 my-12 max-w-lg">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-100">
              <Sparkles size={14} aria-hidden="true" />
              A clearer way to work
            </span>
            <h2 className="mt-6 text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">
              Make good work happen.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-violet-100/85">
              Bring projects, people, and next steps together in one calm,
              focused workspace.
            </p>

            <div className="mt-10 max-w-sm rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-violet-100/75">YOUR WORKSPACE</p>
                  <p className="mt-1 font-semibold">A little more clarity</p>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-200">
                  <Check size={18} aria-hidden="true" />
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                {["Plan the work", "Keep the team in sync", "Move forward together"].map((item) => (
                  <p key={item} className="flex items-center gap-2.5 text-sm text-white/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-200" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <p className="relative z-10 text-sm text-violet-100/70">
            One workspace. Less busywork. Better flow.
          </p>
        </aside>

        <div className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                <FolderKanban size={22} aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900">TaskFlow</h1>
                <p className="text-sm text-slate-500">Manage work, together.</p>
              </div>
            </div>

            <p className="text-sm font-semibold text-violet-700">WELCOME BACK</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Good to see you.
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Log in to pick up where your team left off.
            </p>

            {error && (
              <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3.5 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-100"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-700/25 disabled:opacity-60"
              >
                {submitting && <LoaderCircle className="animate-spin" size={18} />}
                {submitting ? "Logging in..." : "Log in"}
                {!submitting && <ArrowUpRight size={18} aria-hidden="true" />}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link to="/register" className="font-semibold text-violet-700 hover:text-violet-900">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
