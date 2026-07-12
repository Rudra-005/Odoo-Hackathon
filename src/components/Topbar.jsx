import { Search, LogOut } from "lucide-react";
import { useStore } from "../store";

const ROLE_SHORT = {
  "Fleet Manager": "FM",
  Dispatcher: "DP",
  "Safety Officer": "SO",
  "Financial Analyst": "FA",
};

export default function Topbar({ title }) {
  const { user, logout } = useStore();

  return (
    <header className="h-16 shrink-0 border-b border-base-700 flex items-center justify-between px-6 gap-4 bg-base-950/60">
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            placeholder="Search…"
            className="w-full rounded-sm pl-9 pr-3 py-2 text-sm placeholder:text-ink-500"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-ink-300">{user?.email?.split("@")[0] || "Guest"}</span>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-sm bg-base-800 text-xs text-ink-300 border border-base-700">
            {user?.role}
          </span>
          <span className="w-7 h-7 rounded-full bg-accent/20 text-accent text-xs font-semibold flex items-center justify-center">
            {ROLE_SHORT[user?.role] || "?"}
          </span>
        </div>
        <button
          onClick={logout}
          title="Sign out"
          className="text-ink-500 hover:text-bad transition-colors"
        >
          <LogOut size={17} />
        </button>
      </div>
    </header>
  );
}
