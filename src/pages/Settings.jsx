import { useState } from "react";
import Layout from "../components/Layout";
import { Panel, Button, Field } from "../components/ui";

const MATRIX = [
  { role: "Fleet Manager", dashboard: "✓", fleet: "✓", drivers: "—", trips: "—", maintenance: "✓", fuel: "—", analytics: "✓" },
  { role: "Dispatcher", dashboard: "view", fleet: "—", drivers: "—", trips: "✓", maintenance: "—", fuel: "—", analytics: "—" },
  { role: "Safety Officer", dashboard: "—", fleet: "—", drivers: "✓", trips: "view", maintenance: "—", fuel: "—", analytics: "—" },
  { role: "Financial Analyst", dashboard: "—", fleet: "—", drivers: "—", trips: "—", maintenance: "—", fuel: "✓", analytics: "✓" },
];

export default function Settings() {
  const [depot, setDepot] = useState("Gandhinagar Depot ADV");
  const [currency, setCurrency] = useState("INR (₹)");
  const [unit, setUnit] = useState("Kilometers");
  const [saved, setSaved] = useState(false);

  const save = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout title="Settings & RBAC" permKey="settings">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="General">
          <form onSubmit={save} className="space-y-4">
            <Field label="Depot Name">
              <input value={depot} onChange={(e) => setDepot(e.target.value)} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
            <Field label="Currency">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="rounded-sm px-3 py-2 text-sm">
                <option>INR (₹)</option>
                <option>USD ($)</option>
              </select>
            </Field>
            <Field label="Distance Unit">
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className="rounded-sm px-3 py-2 text-sm">
                <option>Kilometers</option>
                <option>Miles</option>
              </select>
            </Field>
            <Button type="submit">{saved ? "Saved ✓" : "Save changes"}</Button>
          </form>
        </Panel>

        <Panel title="Role-Based Access (RBAC)">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left uppercase text-ink-500 border-b border-base-700">
                  <th className="pb-2 pr-3 font-medium">Role</th>
                  <th className="pb-2 pr-3 font-medium">Dash</th>
                  <th className="pb-2 pr-3 font-medium">Fleet</th>
                  <th className="pb-2 pr-3 font-medium">Drivers</th>
                  <th className="pb-2 pr-3 font-medium">Trips</th>
                  <th className="pb-2 pr-3 font-medium">Maint.</th>
                  <th className="pb-2 pr-3 font-medium">Fuel/Exp</th>
                  <th className="pb-2 font-medium">Analytics</th>
                </tr>
              </thead>
              <tbody>
                {MATRIX.map((r) => (
                  <tr key={r.role} className="border-b border-base-800 last:border-0">
                    <td className="py-2.5 pr-3 text-ink-100">{r.role}</td>
                    <td className="py-2.5 pr-3 text-ink-300">{r.dashboard}</td>
                    <td className="py-2.5 pr-3 text-ink-300">{r.fleet}</td>
                    <td className="py-2.5 pr-3 text-ink-300">{r.drivers}</td>
                    <td className="py-2.5 pr-3 text-ink-300">{r.trips}</td>
                    <td className="py-2.5 pr-3 text-ink-300">{r.maintenance}</td>
                    <td className="py-2.5 pr-3 text-ink-300">{r.fuel}</td>
                    <td className="py-2.5 text-ink-300">{r.analytics}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-ink-500 mt-4">✓ full access · view read-only · — no access</p>
        </Panel>
      </div>
    </Layout>
  );
}
