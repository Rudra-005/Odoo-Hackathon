import { HashRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import VehicleRegistry from "./pages/VehicleRegistry";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import FuelExpense from "./pages/FuelExpense";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/fleet" element={<VehicleRegistry />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/trips" element={<Trips />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/fuel" element={<FuelExpense />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </HashRouter>
  );
}
