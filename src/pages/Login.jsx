import { useState } from "react";
import { Navigate } from "react-router-dom";
import { TruckIcon } from "lucide-react";
import { useStore } from "../store";
import { Button, Alert } from "../components/ui";

const ROLES = ["Fleet Manager", "Dispatcher", "Safety Officer", "Financial Analyst"];

const ROLE_NOTES = {
  "Fleet Manager": "Fleet, Maintenance",
  Dispatcher: "Dashboard, Trips",
  "Safety Officer": "Drivers, Compliance",
  "Financial Analyst": "Fuel & Expenses, Analytics",
};

export default function Login() {
  const { user, login, authError, locked } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Dispatcher");
  const [remember, setRemember] = useState(true);

  if (user) return <Navigate to="/" replace />;

  const submit = (e) => {
    e.preventDefault();
    login(email, password, role);
  };

  return (
    <div className="min-h-screen w-full bg-base-950 flex">
      <div className="hidden lg:flex w-[38%] bg-base-900 border-r border-base-700 flex-col justify-between p-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-sm bg-accent/15 flex items-center justify-center">
            <TruckIcon size={20} className="text-accent" />
          </div>
          <div>
            <div className="font-display font-semibold">TransitOps</div>
            <div className="text-xs text-ink-500">Smart Transport Operations Platform</div>
          </div>
        </div>
        <div>
          <p className="text-sm text-ink-300 mb-4">One login, four roles:</p>
          <ul className="space-y-2 text-sm text-ink-100">
            {ROLES.map((r) => (
              <li key={r} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="text-xs text-ink-500 space-y-1">
          <p className="text-ink-300 mb-1">Access is scoped by role after login:</p>
          {ROLES.map((r) => (
            <p key={r}>
              {r} → {ROLE_NOTES[r]}
            </p>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <h1 className="font-display text-2xl font-semibold">Sign in to your account</h1>
            <p className="text-sm text-ink-500 mt-1">Enter your credentials to continue</p>
          </div>

          {(authError || locked) && (
            <Alert type="bad">
              {locked ? "Account locked after 5 failed attempts." : authError}
            </Alert>
          )}

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-ink-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@transitops.in"
              className="w-full rounded-sm px-3 py-2.5 text-sm"
              disabled={locked}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-ink-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-sm px-3 py-2.5 text-sm"
              disabled={locked}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wide text-ink-500">Role (RBAC)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-sm px-3 py-2.5 text-sm"
              disabled={locked}
            >
              {ROLES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-ink-300">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="rounded-sm" />
              Remember me
            </label>
            <a className="text-accent hover:underline cursor-pointer">Forgot password?</a>
          </div>

          <Button type="submit" className="w-full" disabled={locked}>
            Sign In
          </Button>

          <p className="text-[11px] text-ink-500 text-center pt-2">
            Demo: any email + password combination signs you in as the selected role.
          </p>
        </form>
      </div>
    </div>
  );
}
