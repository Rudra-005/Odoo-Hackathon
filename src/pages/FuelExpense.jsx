import { useState } from "react";
import Layout from "../components/Layout";
import { useStore } from "../store";
import { Panel, Button, Modal, Field, Alert } from "../components/ui";
import { Plus } from "lucide-react";

export default function FuelExpense() {
  const { vehicles, trips, fuelLogs, expenses, addFuelLog, addExpense, totalOperationalCost } = useStore();
  const [fuelOpen, setFuelOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicleId: "", date: "", liters: "", cost: "" });
  const [expForm, setExpForm] = useState({ tripId: "", vehicleId: "", toll: "", other: "" });
  const [error, setError] = useState("");

  const vehicleReg = (id) => vehicles.find((v) => v.id === id)?.reg || "—";

  const submitFuel = (e) => {
    e.preventDefault();
    if (!fuelForm.vehicleId || !fuelForm.date || !fuelForm.liters) {
      setError("Vehicle, date and liters are required.");
      return;
    }
    addFuelLog({ ...fuelForm, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost) || 0 });
    setFuelOpen(false);
    setError("");
    setFuelForm({ vehicleId: "", date: "", liters: "", cost: "" });
  };

  const submitExpense = (e) => {
    e.preventDefault();
    if (!expForm.vehicleId) {
      setError("Vehicle is required.");
      return;
    }
    addExpense({ ...expForm, toll: Number(expForm.toll) || 0, other: Number(expForm.other) || 0 });
    setExpOpen(false);
    setError("");
    setExpForm({ tripId: "", vehicleId: "", toll: "", other: "" });
  };

  return (
    <Layout title="Fuel & Expense Management" permKey="fuel">
      <div className="space-y-6">
        <Panel
          title="Fuel Logs"
          actions={
            <Button onClick={() => setFuelOpen(true)}>
              <span className="flex items-center gap-1.5"><Plus size={14} /> Log Fuel</span>
            </Button>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-500 border-b border-base-700">
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Date</th>
                <th className="pb-2 font-medium">Liters</th>
                <th className="pb-2 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {[...fuelLogs].reverse().map((f) => (
                <tr key={f.id} className="border-b border-base-800 last:border-0">
                  <td className="py-2.5 font-mono text-xs">{vehicleReg(f.vehicleId)}</td>
                  <td className="py-2.5 text-ink-300">{f.date}</td>
                  <td className="py-2.5 text-ink-300">{f.liters} L</td>
                  <td className="py-2.5 text-ink-300">₹{f.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel
          title="Other Expenses (Toll / Misc)"
          actions={
            <Button onClick={() => setExpOpen(true)}>
              <span className="flex items-center gap-1.5"><Plus size={14} /> Add Expense</span>
            </Button>
          }
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase text-ink-500 border-b border-base-700">
                <th className="pb-2 font-medium">Trip</th>
                <th className="pb-2 font-medium">Vehicle</th>
                <th className="pb-2 font-medium">Toll</th>
                <th className="pb-2 font-medium">Other</th>
                <th className="pb-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {[...expenses].reverse().map((e) => (
                <tr key={e.id} className="border-b border-base-800 last:border-0">
                  <td className="py-2.5 font-mono text-xs">{e.tripId || "—"}</td>
                  <td className="py-2.5 font-mono text-xs">{vehicleReg(e.vehicleId)}</td>
                  <td className="py-2.5 text-ink-300">₹{e.toll.toLocaleString()}</td>
                  <td className="py-2.5 text-ink-300">₹{e.other.toLocaleString()}</td>
                  <td className="py-2.5 text-ink-100">₹{(e.toll + e.other).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-4 pt-4 border-t border-base-700">
            <div className="text-sm">
              <span className="text-ink-500 mr-2">Total Operational Cost (Auto) = Fuel + Maintenance + Expenses</span>
              <span className="text-accent font-display font-semibold text-lg">
                ₹{totalOperationalCost().toLocaleString()}
              </span>
            </div>
          </div>
        </Panel>
      </div>

      <Modal open={fuelOpen} onClose={() => setFuelOpen(false)} title="Log Fuel">
        <form onSubmit={submitFuel} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Vehicle">
            <select value={fuelForm.vehicleId} onChange={(e) => setFuelForm({ ...fuelForm, vehicleId: e.target.value })} className="rounded-sm px-3 py-2 text-sm">
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Date">
              <input type="date" value={fuelForm.date} onChange={(e) => setFuelForm({ ...fuelForm, date: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
            <Field label="Liters">
              <input type="number" value={fuelForm.liters} onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
          </div>
          <Field label="Cost (₹)">
            <input type="number" value={fuelForm.cost} onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setFuelOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Add Expense">
        <form onSubmit={submitExpense} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Trip (optional)">
            <select value={expForm.tripId} onChange={(e) => setExpForm({ ...expForm, tripId: e.target.value })} className="rounded-sm px-3 py-2 text-sm">
              <option value="">None</option>
              {trips.map((t) => <option key={t.id} value={t.id}>{t.id}</option>)}
            </select>
          </Field>
          <Field label="Vehicle">
            <select value={expForm.vehicleId} onChange={(e) => setExpForm({ ...expForm, vehicleId: e.target.value })} className="rounded-sm px-3 py-2 text-sm">
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.reg}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Toll (₹)">
              <input type="number" value={expForm.toll} onChange={(e) => setExpForm({ ...expForm, toll: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
            <Field label="Other (₹)">
              <input type="number" value={expForm.other} onChange={(e) => setExpForm({ ...expForm, other: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setExpOpen(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
