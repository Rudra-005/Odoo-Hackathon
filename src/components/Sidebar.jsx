import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings, TruckIcon,
} from "lucide-react";
import { ROLE_ACCESS } from "../store";

const ITEMS = [
  { key: "dashboard", label: "Dashboard", to: "/", icon: LayoutDashboard },
  { key: "fleet", label: "Fleet", to: "/fleet", icon: Truck },
  { key: "drivers", label: "Drivers", to: "/drivers", icon: Users },
  { key: "trips", label: "Trips", to: "/trips", icon: Route },
  { key: "maintenance", label: "Maintenance", to: "/maintenance", icon: Wrench },
  { key: "fuel", label: "Fuel & Expenses", to: "/fuel", icon: Fuel },
  { key: "analytics", label: "Analytics", to: "/analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", to: "/settings", icon: Settings },
];

export default function Sidebar({ role }) {
  const allowed = ROLE_ACCESS[role] || [];
  const canSee = (key) => key === "settings" || allowed.includes(key);

  return (
    <aside className="w-56 shrink-0 bg-base-900 border-r border-base-700 flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="w-8 h-8 rounded-sm bg-accent/15 flex items-center justify-center">
          <TruckIcon size={18} className="text-accent" />
        </div>
        <div>
          <div className="font-display font-semibold text-sm leading-tight">TransitOps</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {ITEMS.map((item) => {
          const enabled = canSee(item.key);
          const Icon = item.icon;
          if (!enabled) {
            return (
              <div
                key={item.key}
                title="Not permitted for your role"
                className="flex items-center gap-3 px-3 py-2 rounded-sm text-sm text-ink-500/40 cursor-not-allowed select-none"
              >
                <Icon size={16} />
                {item.label}
              </div>
            );
          }
          return (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-colors ${
                  isActive
                    ? "bg-accent/15 text-accent font-medium"
                    : "text-ink-300 hover:bg-base-800 hover:text-ink-100"
                }`
              }
            >
              <Icon size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-4 text-[11px] text-ink-500 border-t border-base-700">
        TransitOps © 2026 · RBAC enabled
      </div>
    </aside>
  );
}
