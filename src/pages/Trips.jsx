import { useState } from "react";
import Layout from "../components/Layout";
import { useStore } from "../store";
import Badge from "../components/Badge";
import { Panel, Button, Field, Alert, EmptyState } from "../components/ui";

const STAGES = ["Draft", "Dispatched", "Completed", "Cancelled"];

function Stepper({ status }) {
  const activeStages = status === "Cancelled" ? ["Draft", "Dispatched"] : STAGES;
  const idx = STAGES.indexOf(status);
  return (
    <div className="flex items-center gap-1.5 mb-6">
      {STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-1.5 flex-1">
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div
              className={`w-3 h-3 rounded-full ${
                i <= idx && status !== "Cancelled"
                  ? "bg-accent"
                  : s === "Cancelled" && status === "Cancelled"
                  ? "bg-bad"
                  : "bg-base-700"
              }`}
            />
            <span className="text-[10px] text-ink-500">{s}</span>
          </div>
          {i < STAGES.length - 1 && <div className="h-px flex-1 bg-base-700" />}
        </div>
      ))}
    </div>
  );
}

export default function Trips() {
  const { trips, vehicles, drivers, createTrip, dispatchTrip, cancelTrip, completeTrip, validateDispatch } = useStore();
  const [form, setForm] = useState({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: "", distance: "" });
  const [selectedTripId, setSelectedTripId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: "", fuelUsed: "" });

  const availableVehicles = vehicles.filter((v) => v.status === "Available");
  const availableDrivers = drivers.filter((d) => d.status === "Available" && new Date(d.expiry) >= new Date());

  const selectedVehicle = vehicles.find((v) => v.id === form.vehicleId);
  const overCapacity =
    selectedVehicle && form.cargoWeight && Number(form.cargoWeight) > Number(selectedVehicle.capacity);

  const draftError = (() => {
    if (!form.source || !form.destination) return null;
    const dummy = { vehicleId: form.vehicleId, driverId: form.driverId, cargoWeight: form.cargoWeight };
    if (!form.vehicleId || !form.driverId) return null;
    return validateDispatch(dummy);
  })();

  const create = (e) => {
    e.preventDefault();
    if (!form.source || !form.destination) return;
    createTrip({
      source: form.source,
      destination: form.destination,
      vehicleId: form.vehicleId || null,
      driverId: form.driverId || null,
      cargoWeight: Number(form.cargoWeight) || 0,
      distance: Number(form.distance) || 0,
    });
    setForm({ source: "", destination: "", vehicleId: "", driverId: "", cargoWeight: "", distance: "" });
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId) || trips[trips.length - 1];

  return (
    <Layout title="Trip Dispatcher" permKey="trips">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Create Trip">
          <form onSubmit={create} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Source">
                <input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
              </Field>
              <Field label="Destination">
                <input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
              </Field>
            </div>
            <Field label="Vehicle (available only)">
              <select value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} className="rounded-sm px-3 py-2 text-sm">
                <option value="">Select vehicle…</option>
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.reg} · {v.capacity} kg capacity</option>
                ))}
              </select>
            </Field>
            <Field label="Driver (available only)">
              <select value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} className="rounded-sm px-3 py-2 text-sm">
                <option value="">Select driver…</option>
                {availableDrivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cargo Weight (kg)">
                <input type="number" value={form.cargoWeight} onChange={(e) => setForm({ ...form, cargoWeight: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
              </Field>
              <Field label="Planned Distance (km)">
                <input type="number" value={form.distance} onChange={(e) => setForm({ ...form, distance: e.target.value })} className="rounded-sm px-3 py-2 text-sm" />
              </Field>
            </div>

            {selectedVehicle && (
              <Alert type={overCapacity ? "bad" : "ok"}>
                Vehicle Capacity: {selectedVehicle.capacity} kg &nbsp;|&nbsp; Cargo Weight: {form.cargoWeight || 0} kg
                {overCapacity && (
                  <div className="mt-1">
                    Capacity exceeded by {Number(form.cargoWeight) - selectedVehicle.capacity} kg — dispatch blocked
                  </div>
                )}
              </Alert>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={!form.source || !form.destination}>
                Create Trip (Draft)
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Live Board">
          {trips.length === 0 && <EmptyState text="No trips yet. Create one to get started." />}
          <div className="space-y-3">
            {[...trips].reverse().map((t) => {
              const v = vehicles.find((x) => x.id === t.vehicleId);
              const d = drivers.find((x) => x.id === t.driverId);
              const error = t.status === "Draft" ? validateDispatch(t) : null;
              return (
                <div key={t.id} className={`p-3 rounded-sm border ${selectedTripId === t.id ? "border-accent" : "border-base-700"} bg-base-850 cursor-pointer`} onClick={() => setSelectedTripId(t.id)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-xs text-ink-500">{t.id}</div>
                      <div className="text-sm mt-0.5">
                        {t.source} <span className="text-ink-500">→</span> {t.destination}
                      </div>
                      <div className="text-xs text-ink-500 mt-1">
                        {v ? `${v.reg} / ${d?.name || "Unassigned"}` : "Awaiting vehicle"}
                      </div>
                    </div>
                    <Badge status={t.status} />
                  </div>

                  {t.status === "Draft" && (
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        className="!py-1.5 !px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatchTrip(t.id);
                        }}
                        disabled={!!error}
                      >
                        Dispatch
                      </Button>
                      <Button
                        variant="ghost"
                        className="!py-1.5 !px-3 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelTrip(t.id);
                        }}
                      >
                        Cancel
                      </Button>
                      {error && <span className="text-[11px] text-bad">{error}</span>}
                    </div>
                  )}

                  {t.status === "Dispatched" && (
                    <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2">
                        <input
                          placeholder="Final odometer"
                          type="number"
                          className="rounded-sm px-2 py-1.5 text-xs flex-1"
                          value={selectedTripId === t.id ? completeForm.finalOdometer : ""}
                          onChange={(e) => {
                            setSelectedTripId(t.id);
                            setCompleteForm({ ...completeForm, finalOdometer: e.target.value });
                          }}
                        />
                        <input
                          placeholder="Fuel used (L)"
                          type="number"
                          className="rounded-sm px-2 py-1.5 text-xs flex-1"
                          value={selectedTripId === t.id ? completeForm.fuelUsed : ""}
                          onChange={(e) => {
                            setSelectedTripId(t.id);
                            setCompleteForm({ ...completeForm, fuelUsed: e.target.value });
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="!py-1.5 !px-3 text-xs"
                          onClick={() =>
                            completeTrip(t.id, Number(completeForm.finalOdometer) || v?.odometer, Number(completeForm.fuelUsed) || 0)
                          }
                        >
                          Complete Trip
                        </Button>
                        <Button variant="ghost" className="!py-1.5 !px-3 text-xs" onClick={() => cancelTrip(t.id)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      {selectedTrip && (
        <Panel title={`Trip Lifecycle · ${selectedTrip.id}`} className="mt-6">
          <Stepper status={selectedTrip.status} />
          <p className="text-[11px] text-ink-500">
            On Complete: odometer → fuel log → expenses → Vehicle &amp; Driver set Available
          </p>
        </Panel>
      )}
    </Layout>
  );
}
