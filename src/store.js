import { create } from "zustand";

// ---------- seed data ----------
const seedVehicles = [
  { id: "V1", reg: "GJ01AH4521", model: "Tata Ace", type: "Van", capacity: 500, odometer: 14000, cost: 620000, status: "Available" },
  { id: "V2", reg: "GJ01AH9981", model: "Ashok Leyland", type: "Truck", capacity: 5000, odometer: 182000, cost: 2450000, status: "On Trip" },
  { id: "V3", reg: "GJ01AH12AD", model: "Maruti Eeco", type: "Mini", capacity: 1000, odometer: 66000, cost: 410000, status: "In Shop" },
  { id: "V4", reg: "GJ01AH0087", model: "Tata 407", type: "Van", capacity: 1500, odometer: 241000, cost: 540000, status: "Retired" },
  { id: "V5", reg: "GJ01AH7734", model: "Bajaj Maxima", type: "Mini", capacity: 450, odometer: 32000, cost: 280000, status: "Available" },
];

const seedDrivers = [
  { id: "D1", name: "Alex", license: "DL-88215", category: "LMV", expiry: "2028-12-01", contact: "9876Xxxxxx", safety: 96, status: "Available" },
  { id: "D2", name: "John", license: "DL-44120", category: "HMV", expiry: "2025-03-01", contact: "9722Xxxxxx", safety: 81, status: "Suspended" },
  { id: "D3", name: "Priya", license: "DL-77031", category: "LMV", expiry: "2027-08-01", contact: "9810Xxxxxx", safety: 99, status: "On Trip" },
  { id: "D4", name: "Suresh", license: "DL-90045", category: "LMV", expiry: "2027-01-01", contact: "9440Xxxxxx", safety: 88, status: "Available" },
];

const seedTrips = [
  { id: "TR001", source: "Gandhinagar Depot", destination: "Ahmedabad Hub", vehicleId: "V2", driverId: "D1", cargoWeight: 450, distance: 45, status: "On Trip" },
  { id: "TR002", source: "Vatva Industrial Area", destination: "Sanand Warehouse", vehicleId: "V2", driverId: "D3", cargoWeight: 300, distance: 30, status: "Completed", fuelUsed: 10, finalOdometer: 182100 },
];

const seedMaintenance = [
  { id: "M1", vehicleId: "V1", service: "Oil Change", cost: 2500, date: "2026-07-01", status: "In Shop" },
  { id: "M2", vehicleId: "V2", service: "Engine Repair", cost: 18000, date: "2026-06-28", status: "Completed" },
  { id: "M3", vehicleId: "V3", service: "Tyre Replace", cost: 6200, date: "2026-07-05", status: "In Shop" },
];

const seedFuel = [
  { id: "F1", vehicleId: "V1", date: "2026-07-05", liters: 42, cost: 3150 },
  { id: "F2", vehicleId: "V2", date: "2026-07-06", liters: 110, cost: 8400 },
  { id: "F3", vehicleId: "V3", date: "2026-07-06", liters: 28, cost: 2050 },
];

const seedExpenses = [
  { id: "E1", tripId: "TR001", vehicleId: "V2", toll: 120, other: 0 },
  { id: "E2", tripId: "TR002", vehicleId: "V2", toll: 340, other: 150 },
];

export const ROLE_ACCESS = {
  "Fleet Manager": ["dashboard", "fleet", "maintenance", "analytics"],
  "Dispatcher": ["dashboard", "trips"],
  "Safety Officer": ["drivers", "trips"],
  "Financial Analyst": ["fuel", "analytics"],
};

const isExpired = (dateStr) => new Date(dateStr) < new Date();

let idCounter = 100;
const nextId = (prefix) => `${prefix}${idCounter++}`;

export const useStore = create((set, get) => ({
  // ---- auth ----
  user: null,
  authError: null,
  failedAttempts: 0,
  locked: false,
  login: (email, password, role) => {
    if (get().locked) {
      set({ authError: "Account locked after 5 failed attempts." });
      return false;
    }
    if (!email || !password) {
      const attempts = get().failedAttempts + 1;
      set({
        authError: "Invalid credentials.",
        failedAttempts: attempts,
        locked: attempts >= 5,
      });
      return false;
    }
    set({ user: { email, role }, authError: null, failedAttempts: 0 });
    return true;
  },
  logout: () => set({ user: null }),

  // ---- entities ----
  vehicles: seedVehicles,
  drivers: seedDrivers,
  trips: seedTrips,
  maintenance: seedMaintenance,
  fuelLogs: seedFuel,
  expenses: seedExpenses,

  // ---- derived ----
  availableVehicles: () => get().vehicles.filter((v) => v.status === "Available"),
  availableDrivers: () => get().drivers.filter((d) => d.status === "Available" && !isExpired(d.expiry)),

  // ---- vehicle CRUD ----
  addVehicle: (v) => {
    const regExists = get().vehicles.some((x) => x.reg.toLowerCase() === v.reg.toLowerCase());
    if (regExists) return { ok: false, error: "Registration number must be unique." };
    const vehicle = { id: nextId("V"), status: "Available", ...v };
    set({ vehicles: [...get().vehicles, vehicle] });
    return { ok: true };
  },

  // ---- driver CRUD ----
  addDriver: (d) => {
    const driver = { id: nextId("D"), status: "Available", ...d };
    set({ drivers: [...get().drivers, driver] });
    return { ok: true };
  },

  // ---- trip lifecycle ----
  createTrip: (t) => {
    const trip = { id: nextId("TR"), status: "Draft", ...t };
    set({ trips: [...get().trips, trip] });
    return { ok: true, trip };
  },

  validateDispatch: (trip) => {
    const vehicle = get().vehicles.find((v) => v.id === trip.vehicleId);
    const driver = get().drivers.find((d) => d.id === trip.driverId);
    if (!vehicle) return "Select a vehicle.";
    if (!driver) return "Select a driver.";
    if (vehicle.status === "Retired" || vehicle.status === "In Shop")
      return "Retired or In Shop vehicles cannot be dispatched.";
    if (vehicle.status === "On Trip") return "Vehicle is already on a trip.";
    if (driver.status === "Suspended" || isExpired(driver.expiry))
      return "Driver has an expired license or is suspended.";
    if (driver.status === "On Trip") return "Driver is already on a trip.";
    if (Number(trip.cargoWeight) > Number(vehicle.capacity))
      return `Cargo weight exceeds vehicle capacity by ${trip.cargoWeight - vehicle.capacity} kg.`;
    return null;
  },

  dispatchTrip: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    const error = get().validateDispatch(trip);
    if (error) return { ok: false, error };
    set({
      trips: get().trips.map((t) => (t.id === tripId ? { ...t, status: "Dispatched" } : t)),
      vehicles: get().vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: "On Trip" } : v)),
      drivers: get().drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "On Trip" } : d)),
    });
    return { ok: true };
  },

  completeTrip: (tripId, finalOdometer, fuelUsed) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return { ok: false, error: "Trip not found." };
    set({
      trips: get().trips.map((t) =>
        t.id === tripId ? { ...t, status: "Completed", finalOdometer, fuelUsed } : t
      ),
      vehicles: get().vehicles.map((v) =>
        v.id === trip.vehicleId ? { ...v, status: "Available", odometer: finalOdometer || v.odometer } : v
      ),
      drivers: get().drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "Available" } : d)),
    });
    return { ok: true };
  },

  cancelTrip: (tripId) => {
    const trip = get().trips.find((t) => t.id === tripId);
    if (!trip) return { ok: false };
    const wasDispatched = trip.status === "Dispatched";
    set({
      trips: get().trips.map((t) => (t.id === tripId ? { ...t, status: "Cancelled" } : t)),
      vehicles: wasDispatched
        ? get().vehicles.map((v) => (v.id === trip.vehicleId ? { ...v, status: "Available" } : v))
        : get().vehicles,
      drivers: wasDispatched
        ? get().drivers.map((d) => (d.id === trip.driverId ? { ...d, status: "Available" } : d))
        : get().drivers,
    });
    return { ok: true };
  },

  // ---- maintenance ----
  addMaintenance: (m) => {
    const record = { id: nextId("M"), status: "In Shop", ...m };
    set({
      maintenance: [...get().maintenance, record],
      vehicles: get().vehicles.map((v) => (v.id === m.vehicleId ? { ...v, status: "In Shop" } : v)),
    });
    return { ok: true };
  },
  closeMaintenance: (id) => {
    const record = get().maintenance.find((m) => m.id === id);
    if (!record) return { ok: false };
    set({
      maintenance: get().maintenance.map((m) => (m.id === id ? { ...m, status: "Completed" } : m)),
      vehicles: get().vehicles.map((v) =>
        v.id === record.vehicleId && v.status !== "Retired" ? { ...v, status: "Available" } : v
      ),
    });
    return { ok: true };
  },

  // ---- fuel & expenses ----
  addFuelLog: (f) => {
    set({ fuelLogs: [...get().fuelLogs, { id: nextId("F"), ...f }] });
    return { ok: true };
  },
  addExpense: (e) => {
    set({ expenses: [...get().expenses, { id: nextId("E"), ...e }] });
    return { ok: true };
  },

  // ---- analytics helpers ----
  operationalCostForVehicle: (vehicleId) => {
    const fuel = get().fuelLogs.filter((f) => f.vehicleId === vehicleId).reduce((s, f) => s + Number(f.cost), 0);
    const maint = get().maintenance.filter((m) => m.vehicleId === vehicleId).reduce((s, m) => s + Number(m.cost), 0);
    const tolls = get().expenses.filter((e) => e.vehicleId === vehicleId).reduce((s, e) => s + Number(e.toll) + Number(e.other), 0);
    return fuel + maint + tolls;
  },
  totalOperationalCost: () => {
    const fuel = get().fuelLogs.reduce((s, f) => s + Number(f.cost), 0);
    const maint = get().maintenance.reduce((s, m) => s + Number(m.cost), 0);
    const tolls = get().expenses.reduce((s, e) => s + Number(e.toll) + Number(e.other), 0);
    return fuel + maint + tolls;
  },
}));

export { isExpired };
