import { Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useStore, ROLE_ACCESS } from "../store";
import { ShieldAlert } from "lucide-react";

export default function Layout({ children, title, permKey }) {
  const { user } = useStore();
  if (!user) return <Navigate to="/login" replace />;

  const allowed = permKey === "settings" || permKey === "dashboard" || ROLE_ACCESS[user.role]?.includes(permKey);

  return (
    <div className="flex h-screen w-full bg-base-950 text-ink-100 overflow-hidden">
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto p-6">
          {allowed ? (
            children
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-ink-500">
              <ShieldAlert size={32} className="text-bad" />
              <p className="text-sm">
                Your role (<span className="text-ink-100">{user.role}</span>) does not have access to this section.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
