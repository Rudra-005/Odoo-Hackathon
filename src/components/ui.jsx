import { X } from "lucide-react";

export function Panel({ title, actions, children, className = "" }) {
  return (
    <div className={`bg-base-900 border border-base-700 rounded-md shadow-panel ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-700">
          {title && <h3 className="font-display font-medium text-sm text-ink-100">{title}</h3>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function StatCard({ label, value, accent = false, sub }) {
  return (
    <div className="bg-base-900 border border-base-700 rounded-md p-4 flex-1 min-w-[140px]">
      <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-2">{label}</div>
      <div className={`font-display text-2xl font-semibold ${accent ? "text-accent" : "text-ink-100"}`}>{value}</div>
      {sub && <div className="text-xs text-ink-500 mt-1">{sub}</div>}
    </div>
  );
}

export function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "px-4 py-2 rounded-sm text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-accent text-base-950 hover:bg-accent-light",
    ghost: "bg-transparent border border-base-700 text-ink-300 hover:bg-base-800",
    danger: "bg-bad/15 text-bad hover:bg-bad/25",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
      {children}
    </label>
  );
}

export function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`w-full ${width} bg-base-900 border border-base-700 rounded-md shadow-panel`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-base-700">
          <h3 className="font-display font-medium text-sm">{title}</h3>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-100">
            <X size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function Alert({ type = "bad", children }) {
  const styles = {
    bad: "bg-bad-bg border-bad/30 text-bad",
    warn: "bg-warn-bg border-warn/30 text-warn",
    ok: "bg-ok-bg border-ok/30 text-ok",
  };
  return (
    <div className={`text-xs px-3 py-2.5 rounded-sm border ${styles[type]}`}>
      {children}
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="text-center text-sm text-ink-500 py-10">{text}</div>;
}
