import { useMemo, useState } from "react";

const initialVehicles = [
  { id: 1, reg: "GJ01AB1234", model: "Eicher Cargo", type: "Truck", capacity: 12000, odometer: 18450, cost: 1800000, status: "Available" },
  { id: 2, reg: "GJ01CD5678", model: "Mahindra Bolero", type: "Van", capacity: 3500, odometer: 8960, cost: 950000, status: "On Trip" },
  { id: 3, reg: "GJ01EF9012", model: "Tata Ace", type: "Mini", capacity: 1800, odometer: 14320, cost: 720000, status: "In Shop" },
];

const initialDrivers = [
  { id: 1, name: "Ravi Sharma", license: "DL0123456789", category: "LMV", expiry: "2026-09-24", contact: "9876543210", safety: 92, status: "Available" },
  { id: 2, name: "Anita Desai", license: "DL9876543210", category: "HMV", expiry: "2025-12-05", contact: "9123456780", safety: 87, status: "Available" },
];

const initialMaintenance = [
  { id: 1, vehicleId: 3, service: "Brake Inspection", cost: 4200, date: "2026-07-01", status: "In Shop" },
];

function toMidnight(dateValue) {
  return new Date(`${dateValue}T00:00:00`);
}

function isExpired(expiryDate) {
  if (!expiryDate) return false;
  return toMidnight(expiryDate) < new Date(new Date().setHours(0, 0, 0, 0));
}

function badgeStyle(status) {
  switch (status) {
    case "Available":
      return { background: "rgba(34, 197, 94, 0.18)", color: "#4ade80" };
    case "On Trip":
      return { background: "rgba(59, 130, 246, 0.18)", color: "#60a5fa" };
    case "In Shop":
      return { background: "rgba(245, 158, 11, 0.18)", color: "#fbbf24" };
    case "Retired":
      return { background: "rgba(239, 68, 68, 0.18)", color: "#f87171" };
    case "Suspended":
      return { background: "rgba(239, 68, 68, 0.18)", color: "#f87171" };
    default:
      return { background: "rgba(148, 163, 184, 0.18)", color: "#cbd5e1" };
  }
}

export default function Registry() {
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [maintenance, setMaintenance] = useState(initialMaintenance);
  const [activeTab, setActiveTab] = useState("fleet");

  const [vehicleSearch, setVehicleSearch] = useState("");
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState("All");
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState("All");
  const [vehicleForm, setVehicleForm] = useState({ reg: "", model: "", type: "Van", capacity: "", odometer: "", cost: "" });
  const [vehicleError, setVehicleError] = useState("");

  const [driverSearch, setDriverSearch] = useState("");
  const [driverForm, setDriverForm] = useState({ name: "", license: "", category: "LMV", expiry: "", contact: "", safety: "90" });
  const [driverError, setDriverError] = useState("");

  const [maintenanceForm, setMaintenanceForm] = useState({ vehicleId: "", service: "", cost: "", date: "" });
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((vehicle) => {
      const matchesSearch = `${vehicle.reg} ${vehicle.model}`.toLowerCase().includes(vehicleSearch.toLowerCase());
      const matchesType = vehicleTypeFilter === "All" || vehicle.type === vehicleTypeFilter;
      const matchesStatus = vehicleStatusFilter === "All" || vehicle.status === vehicleStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, vehicleSearch, vehicleTypeFilter, vehicleStatusFilter]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const haystack = `${driver.name} ${driver.license}`.toLowerCase();
      return haystack.includes(driverSearch.toLowerCase());
    });
  }, [drivers, driverSearch]);

  const addVehicle = (event) => {
    event.preventDefault();
    const reg = vehicleForm.reg.trim();
    const model = vehicleForm.model.trim();
    const capacity = Number(vehicleForm.capacity);

    if (!reg || !model || !vehicleForm.capacity) {
      setVehicleError("Registration number, model, and capacity are required.");
      return;
    }

    const duplicate = vehicles.some((vehicle) => vehicle.reg.toLowerCase() === reg.toLowerCase());
    if (duplicate) {
      setVehicleError("Registration number must be unique.");
      return;
    }

    const nextVehicle = {
      id: Date.now(),
      reg,
      model,
      type: vehicleForm.type,
      capacity,
      odometer: Number(vehicleForm.odometer) || 0,
      cost: Number(vehicleForm.cost) || 0,
      status: "Available",
    };

    setVehicles([nextVehicle, ...vehicles]);
    setVehicleForm({ reg: "", model: "", type: "Van", capacity: "", odometer: "", cost: "" });
    setVehicleError("");
  };

  const addDriver = (event) => {
    event.preventDefault();
    const name = driverForm.name.trim();
    const license = driverForm.license.trim();
    const expiry = driverForm.expiry;

    if (!name || !license || !expiry) {
      setDriverError("Name, license number, and expiry date are required.");
      return;
    }

    const nextDriver = {
      id: Date.now(),
      name,
      license,
      category: driverForm.category,
      expiry,
      contact: driverForm.contact.trim(),
      safety: Number(driverForm.safety) || 90,
      status: isExpired(expiry) ? "Suspended" : "Available",
    };

    setDrivers([nextDriver, ...drivers]);
    setDriverForm({ name: "", license: "", category: "LMV", expiry: "", contact: "", safety: "90" });
    setDriverError("");
  };

  const logMaintenance = (event) => {
    event.preventDefault();
    if (!maintenanceForm.vehicleId || !maintenanceForm.service || !maintenanceForm.date) {
      setMaintenanceMessage("Vehicle, service type, and date are required.");
      return;
    }

    const vehicleId = Number(maintenanceForm.vehicleId);
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId);
    if (!selectedVehicle) {
      setMaintenanceMessage("Please select a valid vehicle.");
      return;
    }

    const record = {
      id: Date.now(),
      vehicleId,
      service: maintenanceForm.service.trim(),
      cost: Number(maintenanceForm.cost) || 0,
      date: maintenanceForm.date,
      status: "In Shop",
    };

    setMaintenance([record, ...maintenance]);
    setVehicles(
      vehicles.map((vehicle) => (vehicle.id === vehicleId ? { ...vehicle, status: "In Shop" } : vehicle))
    );
    setMaintenanceForm({ vehicleId: "", service: "", cost: "", date: "" });
    setMaintenanceMessage("");
  };

  const closeMaintenance = (recordId) => {
    const target = maintenance.find((entry) => entry.id === recordId);
    if (!target) return;

    setMaintenance(
      maintenance.map((entry) => (entry.id === recordId ? { ...entry, status: "Completed" } : entry))
    );

    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === target.vehicleId);
    if (selectedVehicle && selectedVehicle.status !== "Retired") {
      setVehicles(
        vehicles.map((vehicle) => (vehicle.id === target.vehicleId ? { ...vehicle, status: "Available" } : vehicle))
      );
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <p style={styles.eyebrow}>Fleet operations</p>
          <h1 style={styles.title}>Vehicle Registry, Drivers & Maintenance</h1>
          <p style={styles.subtitle}>Manage fleet records, licensing, and service workflows from one place.</p>
        </div>
        <div style={styles.headerStats}>
          <div style={styles.statCard}>
            <strong>{vehicles.length}</strong>
            <span>Vehicles</span>
          </div>
          <div style={styles.statCard}>
            <strong>{drivers.length}</strong>
            <span>Drivers</span>
          </div>
          <div style={styles.statCard}>
            <strong>{maintenance.length}</strong>
            <span>Open logs</span>
          </div>
        </div>
      </div>

      <div style={styles.tabs}>
        {[
          { id: "fleet", label: "Fleet" },
          { id: "drivers", label: "Drivers" },
          { id: "maintenance", label: "Maintenance" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{ ...styles.tabButton, ...(activeTab === tab.id ? styles.activeTab : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "fleet" && (
        <div style={styles.grid}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Vehicle Registry</h2>
                <p style={styles.panelHint}>Search, filter, and add fleet assets with unique registration numbers.</p>
              </div>
            </div>

            <div style={styles.toolbar}>
              <input value={vehicleSearch} onChange={(e) => setVehicleSearch(e.target.value)} placeholder="Search reg. no. or model" style={styles.input} />
              <select value={vehicleTypeFilter} onChange={(e) => setVehicleTypeFilter(e.target.value)} style={styles.input}>
                <option value="All">All types</option>
                <option value="Van">Van</option>
                <option value="Truck">Truck</option>
                <option value="Mini">Mini</option>
              </select>
              <select value={vehicleStatusFilter} onChange={(e) => setVehicleStatusFilter(e.target.value)} style={styles.input}>
                <option value="All">All status</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>

            {filteredVehicles.length === 0 ? (
              <div style={styles.emptyState}>No vehicles match the current filters.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Reg. No.</th>
                      <th style={styles.th}>Model</th>
                      <th style={styles.th}>Type</th>
                      <th style={styles.th}>Capacity</th>
                      <th style={styles.th}>Odometer</th>
                      <th style={styles.th}>Cost</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVehicles.map((vehicle) => (
                      <tr key={vehicle.id}>
                        <td style={styles.td}>{vehicle.reg}</td>
                        <td style={styles.td}>{vehicle.model}</td>
                        <td style={styles.td}>{vehicle.type}</td>
                        <td style={styles.td}>{vehicle.capacity.toLocaleString()} kg</td>
                        <td style={styles.td}>{vehicle.odometer.toLocaleString()}</td>
                        <td style={styles.td}>₹{vehicle.cost.toLocaleString()}</td>
                        <td style={styles.td}><span style={{ ...styles.badge, ...badgeStyle(vehicle.status) }}>{vehicle.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Add Vehicle</h2>
                <p style={styles.panelHint}>Keep registration numbers unique and ready for dispatch.</p>
              </div>
            </div>

            <form onSubmit={addVehicle} style={styles.form}>
              {vehicleError ? <div style={styles.errorBox}>{vehicleError}</div> : null}
              <label style={styles.field}>
                <span>Registration Number</span>
                <input value={vehicleForm.reg} onChange={(e) => setVehicleForm({ ...vehicleForm, reg: e.target.value })} style={styles.input} />
              </label>
              <label style={styles.field}>
                <span>Vehicle Name / Model</span>
                <input value={vehicleForm.model} onChange={(e) => setVehicleForm({ ...vehicleForm, model: e.target.value })} style={styles.input} />
              </label>
              <div style={styles.rowTwo}>
                <label style={styles.field}>
                  <span>Type</span>
                  <select value={vehicleForm.type} onChange={(e) => setVehicleForm({ ...vehicleForm, type: e.target.value })} style={styles.input}>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                  </select>
                </label>
                <label style={styles.field}>
                  <span>Capacity (kg)</span>
                  <input type="number" value={vehicleForm.capacity} onChange={(e) => setVehicleForm({ ...vehicleForm, capacity: e.target.value })} style={styles.input} />
                </label>
              </div>
              <div style={styles.rowTwo}>
                <label style={styles.field}>
                  <span>Odometer</span>
                  <input type="number" value={vehicleForm.odometer} onChange={(e) => setVehicleForm({ ...vehicleForm, odometer: e.target.value })} style={styles.input} />
                </label>
                <label style={styles.field}>
                  <span>Acquisition Cost</span>
                  <input type="number" value={vehicleForm.cost} onChange={(e) => setVehicleForm({ ...vehicleForm, cost: e.target.value })} style={styles.input} />
                </label>
              </div>
              <button type="submit" style={styles.primaryButton}>Save Vehicle</button>
            </form>
          </section>
        </div>
      )}

      {activeTab === "drivers" && (
        <div style={styles.grid}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Drivers & Safety Profiles</h2>
                <p style={styles.panelHint}>Track license validity and safety posture.</p>
              </div>
            </div>

            <div style={styles.toolbar}>
              <input value={driverSearch} onChange={(e) => setDriverSearch(e.target.value)} placeholder="Search driver or license" style={styles.input} />
            </div>

            {filteredDrivers.length === 0 ? (
              <div style={styles.emptyState}>No drivers found with the current search.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Driver</th>
                      <th style={styles.th}>License</th>
                      <th style={styles.th}>Category</th>
                      <th style={styles.th}>Expiry</th>
                      <th style={styles.th}>Contact</th>
                      <th style={styles.th}>Safety</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDrivers.map((driver) => {
                      const expired = isExpired(driver.expiry);
                      return (
                        <tr key={driver.id}>
                          <td style={styles.td}>{driver.name}</td>
                          <td style={styles.td}>{driver.license}</td>
                          <td style={styles.td}>{driver.category}</td>
                          <td style={{ ...styles.td, color: expired ? "#fb7185" : "#e2e8f0" }}>{driver.expiry} {expired ? "(Expired)" : ""}</td>
                          <td style={styles.td}>{driver.contact}</td>
                          <td style={styles.td}>{driver.safety}%</td>
                          <td style={styles.td}><span style={{ ...styles.badge, ...badgeStyle(expired ? "Suspended" : driver.status) }}>{expired ? "Suspended" : driver.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Add Driver</h2>
                <p style={styles.panelHint}>Capture license details and auto-detect expiry risk.</p>
              </div>
            </div>

            <form onSubmit={addDriver} style={styles.form}>
              {driverError ? <div style={styles.errorBox}>{driverError}</div> : null}
              <label style={styles.field}>
                <span>Driver Name</span>
                <input value={driverForm.name} onChange={(e) => setDriverForm({ ...driverForm, name: e.target.value })} style={styles.input} />
              </label>
              <div style={styles.rowTwo}>
                <label style={styles.field}>
                  <span>License Number</span>
                  <input value={driverForm.license} onChange={(e) => setDriverForm({ ...driverForm, license: e.target.value })} style={styles.input} />
                </label>
                <label style={styles.field}>
                  <span>Category</span>
                  <select value={driverForm.category} onChange={(e) => setDriverForm({ ...driverForm, category: e.target.value })} style={styles.input}>
                    <option value="LMV">LMV</option>
                    <option value="HMV">HMV</option>
                  </select>
                </label>
              </div>
              <div style={styles.rowTwo}>
                <label style={styles.field}>
                  <span>License Expiry</span>
                  <input type="date" value={driverForm.expiry} onChange={(e) => setDriverForm({ ...driverForm, expiry: e.target.value })} style={styles.input} />
                </label>
                <label style={styles.field}>
                  <span>Contact Number</span>
                  <input value={driverForm.contact} onChange={(e) => setDriverForm({ ...driverForm, contact: e.target.value })} style={styles.input} />
                </label>
              </div>
              <label style={styles.field}>
                <span>Safety Score (%)</span>
                <input type="number" min="0" max="100" value={driverForm.safety} onChange={(e) => setDriverForm({ ...driverForm, safety: e.target.value })} style={styles.input} />
              </label>
              <button type="submit" style={styles.primaryButton}>Save Driver</button>
            </form>
          </section>
        </div>
      )}

      {activeTab === "maintenance" && (
        <div style={styles.grid}>
          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Log Service Record</h2>
                <p style={styles.panelHint}>Open maintenance records and move vehicles into the shop instantly.</p>
              </div>
            </div>

            <form onSubmit={logMaintenance} style={styles.form}>
              {maintenanceMessage ? <div style={styles.errorBox}>{maintenanceMessage}</div> : null}
              <label style={styles.field}>
                <span>Vehicle</span>
                <select value={maintenanceForm.vehicleId} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, vehicleId: e.target.value })} style={styles.input}>
                  <option value="">Select vehicle…</option>
                  {vehicles.filter((vehicle) => vehicle.status !== "Retired").map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>{vehicle.reg} ({vehicle.status})</option>
                  ))}
                </select>
              </label>
              <label style={styles.field}>
                <span>Service Type</span>
                <input value={maintenanceForm.service} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, service: e.target.value })} placeholder="e.g. Oil Change" style={styles.input} />
              </label>
              <div style={styles.rowTwo}>
                <label style={styles.field}>
                  <span>Cost (₹)</span>
                  <input type="number" value={maintenanceForm.cost} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: e.target.value })} style={styles.input} />
                </label>
                <label style={styles.field}>
                  <span>Date</span>
                  <input type="date" value={maintenanceForm.date} onChange={(e) => setMaintenanceForm({ ...maintenanceForm, date: e.target.value })} style={styles.input} />
                </label>
              </div>
              <button type="submit" style={styles.primaryButton}>Save Record</button>
            </form>
          </section>

          <section style={styles.panel}>
            <div style={styles.panelHeader}>
              <div>
                <h2 style={styles.panelTitle}>Service Log</h2>
                <p style={styles.panelHint}>Close a repair to return the vehicle to Available status.</p>
              </div>
            </div>

            {maintenance.length === 0 ? (
              <div style={styles.emptyState}>No maintenance records yet.</div>
            ) : (
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Vehicle</th>
                      <th style={styles.th}>Service</th>
                      <th style={styles.th}>Cost</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...maintenance].reverse().map((entry) => {
                      const vehicle = vehicles.find((item) => item.id === entry.vehicleId);
                      return (
                        <tr key={entry.id}>
                          <td style={styles.td}>{vehicle ? vehicle.reg : "—"}</td>
                          <td style={styles.td}>{entry.service}</td>
                          <td style={styles.td}>₹{entry.cost.toLocaleString()}</td>
                          <td style={styles.td}><span style={{ ...styles.badge, ...badgeStyle(entry.status) }}>{entry.status}</span></td>
                          <td style={styles.td}>
                            {entry.status === "In Shop" ? (
                              <button type="button" onClick={() => closeMaintenance(entry.id)} style={styles.secondaryButton}>Close & Release</button>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #020617, #111827)",
    color: "#f8fafc",
    padding: "24px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  eyebrow: {
    margin: 0,
    textTransform: "uppercase",
    letterSpacing: "0.2em",
    color: "#60a5fa",
    fontSize: "12px",
    fontWeight: 700,
  },
  title: {
    margin: "6px 0",
    fontSize: "28px",
  },
  subtitle: {
    margin: 0,
    color: "#94a3b8",
    fontSize: "14px",
  },
  headerStats: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
  },
  statCard: {
    minWidth: "100px",
    background: "rgba(15, 23, 42, 0.85)",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: "12px",
    padding: "12px 14px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  tabs: {
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },
  tabButton: {
    border: "1px solid rgba(148, 163, 184, 0.25)",
    background: "rgba(15, 23, 42, 0.6)",
    color: "#cbd5e1",
    borderRadius: "999px",
    padding: "8px 14px",
    cursor: "pointer",
  },
  activeTab: {
    background: "#2563eb",
    color: "white",
    borderColor: "#2563eb",
  },
  grid: {
    display: "grid",
    gap: "20px",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  },
  panel: {
    background: "rgba(15, 23, 42, 0.9)",
    border: "1px solid rgba(148, 163, 184, 0.2)",
    borderRadius: "16px",
    padding: "18px",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  panelTitle: {
    margin: 0,
    fontSize: "18px",
  },
  panelHint: {
    margin: "4px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
  },
  toolbar: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "12px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
    color: "#cbd5e1",
  },
  input: {
    border: "1px solid rgba(148, 163, 184, 0.3)",
    borderRadius: "10px",
    background: "#0f172a",
    color: "#f8fafc",
    padding: "10px 12px",
    fontSize: "14px",
  },
  rowTwo: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
  },
  primaryButton: {
    border: 0,
    borderRadius: "10px",
    background: "#2563eb",
    color: "white",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryButton: {
    border: "1px solid rgba(148, 163, 184, 0.3)",
    borderRadius: "10px",
    background: "transparent",
    color: "#e2e8f0",
    padding: "8px 10px",
    cursor: "pointer",
    fontSize: "12px",
  },
  errorBox: {
    border: "1px solid rgba(248, 113, 133, 0.35)",
    borderRadius: "10px",
    background: "rgba(248, 113, 133, 0.14)",
    color: "#fda4af",
    padding: "10px 12px",
    fontSize: "13px",
  },
  tableWrap: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
  },
  th: {
    textAlign: "left",
    color: "#94a3b8",
    padding: "8px 6px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.2)",
  },
  td: {
    padding: "10px 6px",
    borderBottom: "1px solid rgba(148, 163, 184, 0.12)",
    color: "#e2e8f0",
  },
  badge: {
    display: "inline-block",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 700,
  },
  emptyState: {
    border: "1px dashed rgba(148, 163, 184, 0.3)",
    borderRadius: "12px",
    padding: "18px",
    textAlign: "center",
    color: "#94a3b8",
    fontSize: "13px",
  },
};
