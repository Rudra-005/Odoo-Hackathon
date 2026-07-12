const MAP = {
  Available: "bg-ok-bg text-ok",
  "On Trip": "bg-info-bg text-info",
  "In Shop": "bg-warn-bg text-warn",
  Retired: "bg-bad-bg text-bad",
  Suspended: "bg-bad-bg text-bad",
  "Off Duty": "bg-base-700 text-ink-300",
  Draft: "bg-base-700 text-ink-300",
  Dispatched: "bg-info-bg text-info",
  Completed: "bg-ok-bg text-ok",
  Cancelled: "bg-bad-bg text-bad",
  Active: "bg-ok-bg text-ok",
};

export default function Badge({ status, className = "" }) {
  const cls = MAP[status] || "bg-base-700 text-ink-300";
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium ${cls} ${className}`}>
      {status}
    </span>
  );
}
