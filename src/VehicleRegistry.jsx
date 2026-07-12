import { useState } from "react";
import Layout from "../components/Layout";
import { useStore } from "../store";
import Badge from "../components/Badge";
import { Panel, Button, Modal, Field, Alert } from "../components/ui";
import { Plus } from "lucide-react";

const TYPES = ["Van", "Truck", "Mini"];

export default function VehicleRegistry() {
  const { vehicles, addVehicle } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [form, setForm] = useState({ reg: "", model: "", type: "Van", capacity: "", odometer: "", cost: "" });
  const [error, setError] = useState("");

  const filtered = vehicles.filter(
    (v) =>
      (typeFilter === "All" || v.type === typeFilter) &&
      (statusFilter === "All" || v.status === statusFilter) &&
      (v.reg.toLowerCase().includes(search.toLowerCase()) || v.model.toLowerCase().includes(search.toLowerCase()))
  );

  const submit = (e) => {
    e.preventDefault();
    if (!form.reg || !form.model || !form.capacity) {
      setError("Registration number, model and capacity are required.");
      return;
    }
    const res = addVehicle({
      reg: form.reg,
      model: form.model,
      type: form.type,
      capacity: Number(form.capacity),
      odometer: Number(form.odometer) || 0,
      cost: Number(form.cost) || 0,
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setOpen(false);
    setError("");
    setForm({ reg: "", model: "", type: "Van", capacity: "", odometer: "", cost: "" });
  };

  return (
    <Layout title="Vehicle Registry" permKey="fleet">
      <Panel
        title={`Vehicles (${filtered.length})`}
        actions={
          <div className="flex gap-2 items-center">
            <input
              placeholder="Search reg. no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-sm px-3 py-1.5 text-sm w-44"
            />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-sm px-2 py-1.5 text-sm">
              <option>All</option>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-sm px-2 py-1.5 text-sm">
              <option>All</option>
              <option>Available</option>
              <option>On Trip</option>
              <option>In Shop</option>
              <option>Retired</option>
            </select>
            <Button onClick={() => setOpen(true)}>
              <span className="flex items-center gap-1.5">
                <Plus size={14} /> Add Vehicle
              </span>
            </Button>
          </div>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-ink-500 border-b border-base-700">
              <th className="pb-2 font-medium">Reg. No (unique)</th>
              <th className="pb-2 font-medium">Name/Model</th>
              <th className="pb-2 font-medium">Type</th>
              <th className="pb-2 font-medium">Capacity</th>
              <th className="pb-2 font-medium">Odometer</th>
              <th className="pb-2 font-medium">Acq. Cost</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr key={v.id} className="border-b border-base-800 last:border-0">
                <td className="py-2.5 font-mono text-xs">{v.reg}</td>
                <td className="py-2.5">{v.model}</td>
                <td className="py-2.5 text-ink-300">{v.type}</td>
                <td className="py-2.5 text-ink-300">{v.capacity.toLocaleString()} kg</td>
                <td className="py-2.5 text-ink-300">{v.odometer.toLocaleString()}</td>
                <td className="py-2.5 text-ink-300">₹{v.cost.toLocaleString()}</td>
                <td className="py-2.5">
                  <Badge status={v.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-bad mt-4">
          Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
        </p>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Vehicle">
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Registration Number">
            <input value={form.reg} onChange={(e) => setForm({ ...form, reg: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
          </Field>
          <Field label="Vehicle Name / Model">
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type">
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="rounded-sm px-3 py-2 text-sm">
                {TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Max Load Capacity (kg)">
              <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Odometer">
              <input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
            <Field label="Acquisition Cost (₹)">
              <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Vehicle</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
