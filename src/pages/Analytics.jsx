import { useMemo } from "react";
import Layout from "../components/Layout";
import { useStore } from "../store";
import { Panel, StatCard, Button } from "../components/ui";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Download } from "lucide-react";

export default function Analytics() {
  const { vehicles, trips, fuelLogs, maintenance, expenses, operationalCostForVehicle, totalOperationalCost } = useStore();

  const totalDistance = trips.filter((t) => t.status === "Completed").reduce((s, t) => s + Number(t.distance || 0), 0);
  const totalFuel = fuelLogs.reduce((s, f) => s + Number(f.liters), 0);
  const fuelEfficiency = totalFuel ? (totalDistance / totalFuel).toFixed(1) : "0.0";

  const utilization = vehicles.length
    ? Math.round((vehicles.filter((v) => v.status === "On Trip").length / vehicles.length) * 100)
    : 0;

  const opCost = totalOperationalCost();

  // simple ROI estimate: assume revenue = distance * rate, placeholder rate per km
  const RATE_PER_KM = 45;
  const revenue = totalDistance * RATE_PER_KM;
  const totalAcqCost = vehicles.reduce((s, v) => s + v.cost, 0) || 1;
  const roi = (((revenue - opCost) / totalAcqCost) * 100).toFixed(1);

  const monthlyRevenue = useMemo(() => {
    // synthesize a 7-point trend from trip distances for visualization purposes
    const base = Math.max(1, trips.length);
    return Array.from({ length: 7 }).map((_, i) => ({
      month: `W${i + 1}`,
      revenue: Math.round((revenue / base) * (1 + i * 0.15) || (i + 1) * 8000),
    }));
  }, [revenue, trips.length]);

  const costliest = [...vehicles]
    .map((v) => ({ ...v, opCost: operationalCostForVehicle(v.id) }))
    .sort((a, b) => b.opCost - a.opCost)
    .slice(0, 3);
  const maxCost = Math.max(1, ...costliest.map((v) => v.opCost));

  const exportCsv = () => {
    const rows = [
      ["Vehicle Reg", "Type", "Operational Cost (₹)"],
      ...vehicles.map((v) => [v.reg, v.type, operationalCostForVehicle(v.id)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transitops-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Reports & Analytics" permKey="analytics">
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="ghost" onClick={exportCsv}>
            <span className="flex items-center gap-1.5"><Download size={14} /> Export CSV</span>
          </Button>
        </div>

        <div className="flex flex-wrap gap-4">
          <StatCard label="Fuel Efficiency" value={`${fuelEfficiency} km/l`} accent />
          <StatCard label="Fleet Utilization" value={`${utilization}%`} />
          <StatCard label="Operational Cost" value={`₹${opCost.toLocaleString()}`} />
          <StatCard label="Vehicle ROI" value={`${roi}%`} sub="Revenue - (Maint. + Fuel) / Acq. Cost" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Panel title="Weekly Revenue" className="xl:col-span-2">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#252A34" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#7B8394", fontSize: 12 }} axisLine={{ stroke: "#252A34" }} tickLine={false} />
                <YAxis tick={{ fill: "#7B8394", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "#161920", border: "1px solid #252A34", borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: "#F3F4F6" }}
                  cursor={{ fill: "rgba(224,138,46,0.08)" }}
                />
                <Bar dataKey="revenue" fill="#E08A2E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Top Costliest Vehicles">
            <div className="space-y-4 mt-2">
              {costliest.map((v, i) => (
                <div key={v.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-ink-300">{v.reg}</span>
                    <span className="text-ink-500">₹{v.opCost.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full bg-base-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(v.opCost / maxCost) * 100}%`,
                        background: i === 0 ? "#E4534A" : i === 1 ? "#E0A72E" : "#4E9AF1",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </Layout>
  );
}
