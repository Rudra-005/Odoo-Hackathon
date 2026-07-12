import { useMemo, useState } from "react";
import Layout from "../components/Layout";
import { useStore } from "../store";
import { Panel, StatCard } from "../components/ui";
import Badge from "../components/Badge";

export default function Dashboard() {
  const { vehicles, drivers, trips } = useStore();
  const [vType, setVType] = useState("All");
  const [status, setStatus] = useState("All");

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) => (vType === "All" || v.type === vType) && (status === "All" || v.status === status)
      ),
    [vehicles, vType, status]
  );

  const kpis = {
    active: vehicles.filter((v) => v.status !== "Retired").length,
    available: vehicles.filter((v) => v.status === "Available").length,
    inMaintenance: vehicles.filter((v) => v.status === "In Shop").length,
    activeTrips: trips.filter((t) => t.status === "Dispatched").length,
    pendingTrips: trips.filter((t) => t.status === "Draft").length,
    onDuty: drivers.filter((d) => d.status === "On Trip" || d.status === "Available").length,
  };
  const utilization = vehicles.length
    ? Math.round((vehicles.filter((v) => v.status === "On Trip").length / vehicles.length) * 100)
    : 0;

  const statusCounts = ["Available", "On Trip", "In Shop", "Retired"].map((s) => ({
    status: s,
    count: vehicles.filter((v) => v.status === s).length,
  }));
  const maxCount = Math.max(1, ...statusCounts.map((s) => s.count));

  const vehicleTypes = [...new Set(vehicles.map((v) => v.type))];
  const driverById = (id) => drivers.find((d) => d.id === id);
  const vehicleById = (id) => vehicles.find((v) => v.id === id);

  return (
    <Layout title="Dashboard" permKey="dashboard">
      <div className="space-y-6">
        <Panel>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-ink-500">Vehicle Type</div>
              <select value={vType} onChange={(e) => setVType(e.target.value)} className="rounded-sm px-3 py-2 text-sm">
                <option>All</option>
                {vehicleTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-ink-500">Status</div>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-sm px-3 py-2 text-sm">
                <option>All</option>
                <option>Available</option>
                <option>On Trip</option>
                <option>In Shop</option>
                <option>Retired</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <div className="text-xs uppercase tracking-wide text-ink-500">Region</div>
              <select className="rounded-sm px-3 py-2 text-sm">
                <option>All</option>
                <option>Gandhinagar</option>
                <option>Ahmedabad</option>
              </select>
            </div>
          </div>
        </Panel>

        <div className="flex flex-wrap gap-4">
          <StatCard label="Active Vehicles" value={kpis.active} />
          <StatCard label="Available Vehicles" value={kpis.available} />
          <StatCard label="Vehicles in Maintenance" value={kpis.inMaintenance} />
          <StatCard label="Active Trips" value={kpis.activeTrips} />
          <StatCard label="Pending Trips" value={kpis.pendingTrips} />
          <StatCard label="Drivers On Duty" value={kpis.onDuty} />
          <StatCard label="Fleet Utilization" value={`${utilization}%`} accent />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel title="Recent Trips" className="xl:col-span-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase text-ink-500 border-b border-base-700">
                  <th className="pb-2 font-medium">Trip</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Driver</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">ETA</th>
                </tr>
              </thead>
              <tbody>
                {trips.slice(-6).reverse().map((t) => {
                  const v = vehicleById(t.vehicleId);
                  const d = driverById(t.driverId);
                  return (
                    <tr key={t.id} className="border-b border-base-800 last:border-0">
                      <td className="py-2.5 font-mono text-xs">{t.id}</td>
                      <td className="py-2.5">{v?.reg || "—"}</td>
                      <td className="py-2.5">{d?.name || "—"}</td>
                      <td className="py-2.5">
                        <Badge status={t.status} />
                      </td>
                      <td className="py-2.5 text-ink-500">{t.distance ? `${t.distance} km` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Panel>

          <Panel title="Vehicle Status">
            <div className="space-y-4">
              {statusCounts.map((s) => (
                <div key={s.status}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink-300">{s.status}</span>
                    <span className="text-ink-500">{s.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-base-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        s.status === "Available"
                          ? "bg-ok"
                          : s.status === "On Trip"
                          ? "bg-info"
                          : s.status === "In Shop"
                          ? "bg-warn"
                          : "bg-bad"
                      }`}
                      style={{ width: `${(s.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        {(vType !== "All" || status !== "All") && (
          <Panel title={`Filtered Vehicles (${filteredVehicles.length})`}>
            <div className="flex flex-wrap gap-2">
              {filteredVehicles.map((v) => (
                <div key={v.id} className="px-3 py-1.5 rounded-sm bg-base-800 text-xs flex items-center gap-2">
                  {v.reg} <Badge status={v.status} />
                </div>
              ))}
              {filteredVehicles.length === 0 && <p className="text-sm text-ink-500">No vehicles match these filters.</p>}
            </div>
          </Panel>
        )}
      </div>
    </Layout>
  );
}
