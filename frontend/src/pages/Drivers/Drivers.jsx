import { useState } from "react";
import Layout from "../components/Layout";
import { useStore, isExpired } from "../store";
import Badge from "../components/Badge";
import { Panel, Button, Modal, Field, Alert } from "../components/ui";
import { Plus } from "lucide-react";

export default function Drivers() {
  const { drivers, addDriver } = useStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", license: "", category: "LMV", expiry: "", contact: "", safety: 90 });
  const [error, setError] = useState("");

  const filtered = drivers.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.license.toLowerCase().includes(search.toLowerCase())
  );

  const submit = (e) => {
    e.preventDefault();
    if (!form.name || !form.license || !form.expiry) {
      setError("Name, license number and expiry date are required.");
      return;
    }
    addDriver({ ...form, safety: Number(form.safety) });
    setOpen(false);
    setError("");
    setForm({ name: "", license: "", category: "LMV", expiry: "", contact: "", safety: 90 });
  };

  return (
    <Layout title="Drivers & Safety Profiles" permKey="drivers">
      <Panel
        title={`Drivers (${filtered.length})`}
        actions={
          <div className="flex gap-2 items-center">
            <input
              placeholder="Search…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-sm px-3 py-1.5 text-sm w-44"
            />
            <Button onClick={() => setOpen(true)}>
              <span className="flex items-center gap-1.5">
                <Plus size={14} /> Add Driver
              </span>
            </Button>
          </div>
        }
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase text-ink-500 border-b border-base-700">
              <th className="pb-2 font-medium">Driver</th>
              <th className="pb-2 font-medium">License No.</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Expiry</th>
              <th className="pb-2 font-medium">Contact</th>
              <th className="pb-2 font-medium">Safety</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const expired = isExpired(d.expiry);
              return (
                <tr key={d.id} className="border-b border-base-800 last:border-0">
                  <td className="py-2.5">{d.name}</td>
                  <td className="py-2.5 font-mono text-xs">{d.license}</td>
                  <td className="py-2.5 text-ink-300">{d.category}</td>
                  <td className={`py-2.5 ${expired ? "text-bad" : "text-ink-300"}`}>
                    {d.expiry} {expired && "EXPIRED"}
                  </td>
                  <td className="py-2.5 text-ink-500">{d.contact}</td>
                  <td className="py-2.5 text-ink-300">{d.safety}%</td>
                  <td className="py-2.5">
                    <Badge status={expired ? "Suspended" : d.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[11px] text-bad mt-4">
          Rule: Expired license or Suspended status → blocked from trip assignment
        </p>
      </Panel>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Driver">
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Driver Name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="License Number">
              <input value={form.license} onChange={(e) => setForm({ ...form, license: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-sm px-3 py-2 text-sm">
                <option>LMV</option>
                <option>HMV</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="License Expiry">
              <input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
            <Field label="Contact Number">
              <input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
            </Field>
          </div>
          <Field label="Safety Score (%)">
            <input type="number" min="0" max="100" value={form.safety} onChange={(e) => setForm({ ...form, safety: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Driver</Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
